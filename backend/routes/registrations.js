const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const sendEmail = require('../utils/sendEmail');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');
// Minimum amount Stripe will accept (~$0.50). Use ₹50 as a safe floor.
const MIN_INR = 50;

// Helper: send a rich receipt email for a registration (to owner and all team members with emails) and mark emailSent
async function sendReceiptForRegistration(registration, explicitEmail) {
  try {
    if (!registration) return;
    if (registration.paymentStatus !== 'completed') return;
    try { await registration.populate('eventId'); } catch {}
    try { await registration.populate('userId', 'email name'); } catch {}

    const ev = registration.eventId || {};
    const ownerEmail = (explicitEmail || registration.userId?.email || '').toLowerCase();
    const memberEmails = Array.isArray(registration.teamMembers)
      ? registration.teamMembers.map(m => (m && m.email ? String(m.email).trim().toLowerCase() : '')).filter(Boolean)
      : [];
    const recipients = Array.from(new Set([ownerEmail, ...memberEmails].filter(Boolean)));
    if (recipients.length === 0) return;

    const scheduleHtml = Array.isArray(ev.schedule) && ev.schedule.length > 0
      ? `<ul>${ev.schedule.map((s)=>`<li>${s.date ? new Date(s.date).toLocaleDateString() : ''} ${s.time ? '• ' + s.time : ''}</li>`).join('')}</ul>`
      : '';
    const roundsHtml = ev.hasMultipleRounds ? `<p><strong>Rounds:</strong> ${ev.numberOfRounds}</p>` : '';
    const memberNames = Array.isArray(registration.teamMembers)
      ? registration.teamMembers.map(m => (m && m.name ? String(m.name).trim() : '')).filter(Boolean)
      : [];
    const teamHtml = `
      ${registration.teamName ? `<p><strong>Team:</strong> ${registration.teamName}</p>` : ''}
      ${memberNames.length ? `<p><strong>Team Members:</strong></p><ul>${memberNames.map((n)=>`<li>${n}</li>`).join('')}</ul>` : ''}
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Confirmed</h2>
        <p>Your payment for <strong>${ev.name || ''}</strong> was successful.</p>
        <div style="background:#f8f9fa; padding:16px; border-radius:6px;">
          ${ev.department ? `<p><strong>Department:</strong> ${ev.department}</p>` : ''}
          ${ev.date ? `<p><strong>Date:</strong> ${new Date(ev.date).toLocaleDateString()}</p>` : ''}
          ${ev.time ? `<p><strong>Time:</strong> ${ev.time}</p>` : ''}
          ${ev.location ? `<p><strong>Location:</strong> ${ev.location}</p>` : ''}
          ${scheduleHtml}
          ${roundsHtml}
          <p><strong>Amount Paid:</strong> ₹${registration.totalFee}</p>
          ${teamHtml}
          <p><strong>Registration ID:</strong> ${registration._id}</p>
        </div>
      </div>
    `;

    for (const email of recipients) {
      try { await sendEmail({ email, subject: `Payment Confirmed - ${ev.name || 'Event'}`, html }); }
      catch (e) { console.error('sendReceiptForRegistration to member failed:', email, e?.message || e); }
    }
    registration.emailSent = true;
    await registration.save();
  } catch (e) {
    console.error('sendReceiptForRegistration error:', e);
  }
}

// Helper: send a failure/timeout email once (owner + team members)
async function sendFailureEmail(registration, explicitEmail, reason = 'Payment failed or timed out') {
  try {
    if (!registration) return;
    try { await registration.populate('eventId'); } catch {}
    try { await registration.populate('userId', 'email name'); } catch {}
    const ev = registration.eventId || {};

    const ownerEmail = (explicitEmail || registration.userId?.email || '').toLowerCase();
    const memberEmails = Array.isArray(registration.teamMembers)
      ? registration.teamMembers.map(m => (m && m.email ? String(m.email).trim().toLowerCase() : '')).filter(Boolean)
      : [];
    const recipients = Array.from(new Set([ownerEmail, ...memberEmails].filter(Boolean)));
    if (recipients.length === 0) return;
    if (registration.failureEmailSent) return; // avoid duplicates

    const memberNames = Array.isArray(registration.teamMembers)
      ? registration.teamMembers.map((m)=> (m && m.name ? String(m.name).trim() : '')).filter(Boolean)
      : [];
    const teamHtml = `
      ${registration.teamName ? `<p><strong>Team:</strong> ${registration.teamName}</p>` : ''}
      ${memberNames.length ? `<p><strong>Team Members:</strong></p><ul>${memberNames.map((n)=>`<li>${n}</li>`).join('')}</ul>` : ''}
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#e53935;">Payment Not Completed</h2>
        <p>Your registration for <strong>${ev.name || ''}</strong> could not be confirmed.</p>
        <div style="background:#fdecea; padding:16px; border-radius:6px;">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Amount Due:</strong> ₹${Number(registration.totalFee || 0)}</p>
          ${teamHtml}
          <p style="margin-top:12px;">Please try registering again. If the amount was debited, it should be reversed by your provider. For assistance, contact support.</p>
        </div>
      </div>
    `;

    for (const email of recipients) {
      try { await sendEmail({ email, subject: `Payment Not Completed - ${ev.name || 'Event'}`, html }); }
      catch (e) { console.error('sendFailureEmail to member failed:', email, e?.message || e); }
    }
    registration.failureEmailSent = true;
    await registration.save();
  } catch (e) {
    console.error('sendFailureEmail error:', e);
  }
}

// @route GET /api/registrations/my-events
// @desc Get user's registered events
// @access Private
router.get('/my-events', auth, async (req, res) => {
  try {
    // Include: registrations owned by user OR where user's email is in teamMembers.email
    // Additionally: if team member emails were not captured, match by email local-part vs teamMembers.name
    const orClauses = [ { userId: req.user._id } ];
    if (req.user?.email) {
      const emailLower = String(req.user.email).toLowerCase();
      const local = emailLower.split('@')[0] || '';
      orClauses.push({ 'teamMembers.email': emailLower });
      if (local) {
        orClauses.push({ 'teamMembers.name': { $regex: new RegExp(`^${local}$`, 'i') } });
      }
    }
    const registrations = await Registration.find({ $or: orClauses })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    // Keep completed payments always. For pending, keep only up to TTL minutes.
    const ttlMinutes = parseInt(process.env.PAYMENT_PENDING_TTL_MINUTES || '30', 10);
    const now = Date.now();

    const toDelete = [];
    const filtered = registrations.filter((r) => {
      // Remove if event missing or invalid
      if (!r.eventId) { toDelete.push(r._id); return false; }
      const eventDate = new Date(r.eventId.date);
      if (Number.isNaN(eventDate.getTime())) { toDelete.push(r._id); return false; }
      if (r.paymentStatus === 'failed') return false; // hide failed payments
      // Show completed always (owner or team member)
      if (r.paymentStatus === 'completed') return true;
      // For pending, keep only up to TTL minutes (owner or team member)
      const ageMinutes = (now - new Date(r.registeredAt).getTime()) / (1000 * 60);
      const keep = ageMinutes <= ttlMinutes;
      if (!keep) toDelete.push(r._id);
      return keep;
    });

    // Best-effort async cleanup of expired pending registrations
    if (toDelete.length > 0) {
      Registration.deleteMany({ _id: { $in: toDelete } }).catch((e) =>
        console.error('Cleanup expired pending registrations failed:', e)
      );
    }

    // Fallback: for any completed registrations with emailSent=false, send receipt now (best-effort, async)
    (async () => {
      try {
        for (const r of filtered) {
          if (r.paymentStatus === 'completed' && !r.emailSent) {
            // Need user's email; fetch if not populated
            if (!r.userId || !r.userId.email) {
              await r.populate('userId', 'email');
            }
            await sendReceiptForRegistration(r, r.userId?.email);
          }
        }
      } catch (e) {
        console.error('Fallback send receipts error:', e);
      }
    })();

    res.json(filtered);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/registrations/stats
// @desc Registration statistics (admin only)
// @access Private (Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { eventId, start, end } = req.query;

    const match = {};
    if (eventId) match.eventId = new mongoose.Types.ObjectId(eventId);
    if (start || end) {
      match.registeredAt = {};
      if (start) match.registeredAt.$gte = new Date(start);
      if (end) match.registeredAt.$lte = new Date(end);
    }

    const pipelineBase = [ { $match: match } ];

    const groupByField = (field) => ([
      ...pipelineBase,
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: { _id: `$user.${field}`, count: { $sum: 1 } } },
      { $project: { label: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    const byGender = await Registration.aggregate(groupByField('gender'));
    const byYear = await Registration.aggregate(groupByField('year'));
    const byDepartment = await Registration.aggregate([
      ...pipelineBase,
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { label: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    const byDay = await Registration.aggregate([
      ...pipelineBase,
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } }, count: { $sum: 1 } } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    res.json({ byGender, byYear, byDepartment, byDay });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/registrations/event/:eventId
// @desc Get all registrations for an event (Admin only)
// @access Private (Admin)
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('userId', 'email gender year')
      .populate('eventId', 'name date time location')
      .sort({ registeredAt: -1 });

    // Resolve team member genders/years using email if present, otherwise match by email local-part (before @)
    // Build sets of identifiers
    const emails = new Set();
    const locals = new Set();
    for (const r of registrations) {
      if (Array.isArray(r.teamMembers)) {
        for (const m of r.teamMembers) {
          const e = (m?.email || '').toLowerCase();
          const n = (m?.name || '').trim().toLowerCase();
          if (e) emails.add(e);
          if (n) locals.add(n);
        }
      }
    }

    let metaEmail = new Map();
    let metaLocal = new Map();
    try {
      const User = require('../models/User');
      const allUsers = await User.find({
        $or: [
          emails.size ? { email: { $in: Array.from(emails) } } : { _id: null },
          locals.size ? { email: { $exists: true } } : { _id: null },
        ]
      }).select('email gender year');
      for (const u of allUsers) {
        const e = String(u.email || '').toLowerCase();
        const info = { gender: u.gender || 'unknown', year: u.year || 'unknown' };
        if (e) metaEmail.set(e, info);
        const local = e.split('@')[0] || '';
        if (local && !metaLocal.has(local)) metaLocal.set(local, info);
      }
    } catch (e) {
      console.error('Failed resolving team member demographics:', e?.message || e);
    }

    const enriched = registrations.map((r) => {
      const teamResolved = Array.isArray(r.teamMembers)
        ? r.teamMembers.map((m) => {
            const e = (m?.email || '').toLowerCase();
            let info = e ? metaEmail.get(e) : null;
            if (!info) {
              const key = (m?.name || '').trim().toLowerCase();
              if (key) info = metaLocal.get(key);
            }
            return {
              name: m?.name || '',
              email: m?.email || '',
              gender: info?.gender || 'unknown',
              year: info?.year || 'unknown',
            };
          })
        : [];
      // Attach as a plain object to avoid mutating mongoose doc directly
      const obj = r.toObject({ virtuals: true });
      obj.teamResolved = teamResolved;
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/registrations/register
// @desc Register for an event
// @access Private
router.post('/register', auth, async (req, res) => {
  try {
    // Disallow admins from registering for events
    if (req.user?.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot register for events' });
    }
    const { eventId, department, teamName, teamMembers } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      userId: req.user._id
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // For main events, allow registration only if basic registration is enabled
    if (event.isMainEvent && !event.basicRegistrationEnabled) {
      return res.status(400).json({ message: 'Registration is not enabled for this main event' });
    }

    // Derive team constraints from event
    const reg = event.registrationDetails || {};
    const feePerHead = reg.feePerHead || 0;
    const teamCfg = reg.teamSize || { type: 'individual', value: 1, minValue: 1, maxValue: 1 };
    const teamsAllowed = !!reg.teamParticipation && teamCfg.type !== 'individual';

    // Normalize incoming team members EXACTLY as provided on the form (full list including leader)
    let incomingMembers = Array.isArray(teamMembers)
      ? teamMembers.map((m)=> ({
          name: String(m?.name || '').trim(),
          email: m?.email ? String(m.email).trim().toLowerCase() : null,
          phone: m?.phone ? String(m.phone).trim() : null,
        })).filter((m)=> m.name)
      : [];
    // Compute team size from provided names when team participation is allowed
    let computedTeamSize = teamsAllowed ? (incomingMembers.length || 1) : 1;

    // Enforce constraints based on type
    switch (teamCfg.type) {
      case 'individual': {
        computedTeamSize = 1;
        incomingMembers = []; // no additional members
        break;
      }
      case 'fixed':
      case 'at_most':
      case 'at_least':
      case 'range': {
        const minVal = Math.max(1, teamCfg.minValue || teamCfg.value || 1);
        const maxVal = Math.max(minVal, teamCfg.maxValue || teamCfg.value || minVal);
        if (teamCfg.type === 'fixed') {
          if (teamCfg.value && computedTeamSize !== teamCfg.value) {
            return res.status(400).json({ message: `Team size must be exactly ${teamCfg.value}` });
          }
          // Ensure we have exactly the provided number of names
          if (incomingMembers.length !== (teamCfg.value || 1)) {
            return res.status(400).json({ message: `Please provide exactly ${teamCfg.value || 1} team member name(s) including you` });
          }
        } else if (teamCfg.type === 'range') {
          if (computedTeamSize < minVal || computedTeamSize > maxVal) {
            return res.status(400).json({ message: `Team size must be between ${minVal} and ${maxVal}` });
          }
        } else if (teamCfg.type === 'at_most') {
          if (computedTeamSize < 1 || computedTeamSize > maxVal) {
            return res.status(400).json({ message: `Team size must be between 1 and ${maxVal}` });
          }
        } else if (teamCfg.type === 'at_least') {
          if (computedTeamSize < minVal) {
            return res.status(400).json({ message: `Team size must be at least ${minVal}` });
          }
        }
        break;
      }
      default:
        computedTeamSize = 1;
        if (incomingMembers.length === 0) incomingMembers = [];
    }

    // Calculate total fee
    // - For main events: use basicRegistrationAmount
    // - For sub/department events: treat feePerHead as TOTAL TEAM FEE (no per-head math)
    let totalFee = event.isMainEvent
      ? Number(event.basicRegistrationAmount || 0)
      : Number(feePerHead || 0);

    // Create registration
    const registration = new Registration({
      eventId,
      userId: req.user._id,
      department: department || null,
      year: req.body.year || null,
      teamName: teamName || null,
      // Store exact names provided
      teamMembers: teamsAllowed ? incomingMembers : (incomingMembers.length ? [incomingMembers[0]] : []),
      totalFee
    });

    if (totalFee >= MIN_INR) {
      // Create Stripe payment intent (amount in paise)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalFee * 100),
        currency: 'inr',
        // Enable Card + UPI via automatic payment methods
        automatic_payment_methods: { enabled: true },
        receipt_email: req.user.email,
        metadata: {
          eventId: eventId.toString(),
          userId: req.user._id.toString(),
          registrationId: registration._id.toString()
        }
      });
      registration.stripe_payment_intent_id = paymentIntent.id;
    } else {
      // Treat fees below threshold as free to avoid Stripe amount_too_small
      registration.paymentStatus = 'completed';
    }

    await registration.save();
    await registration.populate('eventId');
    await registration.populate('userId', 'email name');

    // Only send immediate email if free (auto-completed). Paid flows will send on webhook success.
    if (registration.paymentStatus === 'completed') {
      await sendReceiptForRegistration(registration, registration.userId?.email);
    }

    // Build client response
    let clientSecret = null;
    if (registration.stripe_payment_intent_id) {
      // retrieve intent to expose client_secret
      const intent = await stripe.paymentIntents.retrieve(registration.stripe_payment_intent_id);
      clientSecret = intent.client_secret;
    }
    res.status(201).json({ registration, clientSecret });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/registrations/:id
// @desc Get a single registration and clientSecret for payment
// @access Private (owner or admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId', 'name date time location')
      .populate('userId', 'email role');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    // Only owner or admin can view
    const isOwner = registration.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    let clientSecret = null;
    if (registration.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(registration.stripe_payment_intent_id);
      clientSecret = intent.client_secret;
    }
    res.json({ registration, clientSecret });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Standalone webhook handler to be mounted before JSON middleware in server.js
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const registration = await Registration.findOne({
          stripe_payment_intent_id: paymentIntent.id
        }).populate('eventId').populate('userId');

        if (registration) {
          registration.paymentStatus = 'completed';
          registration.stripe_payment_id = paymentIntent.id;
          await registration.save();
          await sendReceiptForRegistration(registration, registration.userId?.email);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        const failedRegistration = await Registration.findOne({
          stripe_payment_intent_id: failedPayment.id
        });
        if (failedRegistration) {
          failedRegistration.paymentStatus = 'failed';
          await failedRegistration.save();
          await sendFailureEmail(failedRegistration, null, 'Stripe reported payment failure');
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Server error');
  }
};

// @route DELETE /api/registrations/:id
// @desc Cancel registration
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check if user owns this registration or is admin
    if (registration.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if payment was completed (you might want to handle refunds here)
    if (registration.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel paid registration. Please contact admin for refund.' });
    }

    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/registrations/:id/send-receipt
// @desc Resend receipt/confirmation email if payment completed
// @access Private (owner or admin)
router.post('/:id/send-receipt', auth, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('eventId')
      .populate('userId', 'email role name');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const isOwner = registration.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    if (registration.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'Receipt available only after successful payment' });
    }

    await sendReceiptForRegistration(registration, registration.userId?.email);
    res.json({ message: 'Receipt sent' });
  } catch (err) {
    console.error('Resend receipt error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.webhookHandler = webhookHandler;
