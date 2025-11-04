const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { auth, adminAuth } = require('../middleware/auth');

// @route GET /api/events
// @desc Get all events with filtering
// @access Public
router.get('/', async (req, res) => {
  try {
    const { department, status, timeframe, isMainEvent, parentEvent, includeSubCount, search, limit } = req.query;
    let filter = {};

    // Search filter (search by event name or description)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Department filter (honor any provided department, including 'Common')
    if (department) {
      filter.department = department;
    }

    // Main event filter
    if (isMainEvent !== undefined) {
      filter.isMainEvent = isMainEvent === 'true';
    }

    // Parent event filter (for sub-events)
    if (parentEvent) {
      filter.parentEvent = parentEvent;
    }

    // Status filter (upcoming, live, ended)
    const now = new Date();
    if (status) {
      switch (status) {
        case 'upcoming':
          filter.date = { $gt: now };
          break;
        case 'live':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filter.date = { $gte: today, $lt: tomorrow };
          break;
        case 'ended':
          filter.date = { $lt: now };
          break;
      }
    }

    // Timeframe filter for upcoming events
    if (timeframe && status === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (timeframe) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filter.date = { $gte: today, $lt: tomorrow };
          break;
        case 'this_week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          filter.date = { $gte: today, $lt: weekEnd };
          break;
        case 'this_month':
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          filter.date = { $gte: today, $lt: monthEnd };
          break;
      }
    }

    let query = Event.find(filter)
      .populate('createdBy', 'email role')
      .populate('parentEvent', 'name')
      .sort({ date: 1 });

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    let events = await query;

    // Optionally include registration counts (completed payments only)
    if (req.query.includeRegCount === 'true' && Array.isArray(events) && events.length) {
      const ids = events.map((e) => e._id);
      try {
        const regCounts = await Registration.aggregate([
          { $match: { eventId: { $in: ids }, paymentStatus: 'completed' } },
          { $group: { _id: '$eventId', count: { $sum: 1 } } }
        ]);
        const map = new Map(regCounts.map((x) => [String(x._id), x.count]));
        events = events.map((doc) => {
          const o = doc.toObject ? doc.toObject() : doc;
          o.registrationCount = map.get(String(doc._id)) || 0;
          return o;
        });
      } catch (e) {
        // On error, fall back without counts
      }
    }

    // Optionally include hasSubEvents flag for each event
    if (includeSubCount === 'true') {
      const mainIds = events.filter((e) => e.isMainEvent).map((e) => e._id);
      if (mainIds.length > 0) {
        const counts = await Event.aggregate([
          { $match: { parentEvent: { $in: mainIds } } },
          { $group: { _id: '$parentEvent', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
        events = events.map((doc) => {
          const base = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
          return {
            ...base,
            hasSubEvents: (countMap.get(String(doc._id)) || 0) > 0,
          };
        });
      } else {
        events = events.map((doc) => {
          const base = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
          return { ...base, hasSubEvents: false };
        });
      }
    }

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/events/departments/list
// @desc Get list of all departments
// @access Public
router.get('/departments/list', async (req, res) => {
  try {
    const departments = await Event.distinct('department', { department: { $ne: null } });
    res.json(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/events/:id
// @desc Get single event
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('parentEvent', 'name')
      .populate('createdBy', 'name email')
      .populate({
        path: 'winners.registrationId',
        select: 'teamName teamMembers paymentStatus'
      });
      
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Transform winners data for frontend
    const eventObj = event.toObject();
    
    if (eventObj.winners) {
      eventObj.winners = eventObj.winners.map(winner => ({
        ...winner,
        teamName: winner.teamName || (winner.registrationId?.teamName || ''),
        participantName: winner.participantName || 
                        (winner.registrationId?.teamMembers?.[0]?.name || ''),
        paymentStatus: winner.registrationId?.paymentStatus
      }));
    }

    res.json(eventObj);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route GET /api/events/:id/sub-events
// @desc Get sub-events of a main event
// @access Public
router.get('/:id/sub-events', async (req, res) => {
  try {
    const subEvents = await Event.find({ parentEvent: req.params.id })
      .populate('createdBy', 'email role')
      .sort({ date: 1 });

    res.json(subEvents);
  } catch (error) {
    console.error('Get sub-events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/events
// @desc Create new event
// @access Private (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      time,
      location,
      imageUrl,
      isMainEvent,
      parentEvent,
      department,
      eligibleDepartments,
      categories,
      registrationDetails,
      adminContacts,
      certificateTemplateUrl,
      certificateOrganizer,
      certificateAwardText,
      basicRegistrationEnabled,
      basicRegistrationAmount,
      winnerPrize,
      runnerPrize,
    } = req.body;

    // Sanitize relationships
    let parent = parentEvent;
    let isMain = isMainEvent;
    if (typeof parent === 'string' && parent.trim() === '') parent = null;
    if (isMain === true) parent = null; // main events cannot have a parent
    if (parent) isMain = false; // if parent specified, this is sub-event

    const event = new Event({
      name,
      description,
      date,
      time,
      location,
      imageUrl,
      isMainEvent: isMain,
      parentEvent: parent,
      department,
      eligibleDepartments: Array.isArray(eligibleDepartments) ? eligibleDepartments : [],
      categories: Array.isArray(categories) ? categories : [],
      registrationDetails,
      adminContacts: Array.isArray(adminContacts) ? adminContacts : [],
      certificateTemplateUrl: certificateTemplateUrl || '',
      certificateOrganizer: certificateOrganizer || '',
      certificateAwardText: certificateAwardText || 'Certificate of Participation',
      basicRegistrationEnabled: !!basicRegistrationEnabled,
      basicRegistrationAmount: Number(basicRegistrationAmount || 0),
      winnerPrize: Number(winnerPrize || 0),
      runnerPrize: Number(runnerPrize || 0),
      createdBy: req.user._id
    });
    await event.save();
    await event.populate('createdBy', 'email role');

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/events/:id
// @desc Update event
// @access Private (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      time,
      location,
      imageUrl,
      isMainEvent,
      parentEvent,
      department,
      eligibleDepartments,
      categories,
      registrationDetails,
      adminContacts,
      certificateTemplateUrl,
      certificateOrganizer,
      certificateAwardText,
      basicRegistrationEnabled,
      basicRegistrationAmount,
      winnerPrize,
      runnerPrize,
    } = req.body;

    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Sanitize relationships
    let parent = parentEvent;
    let isMain = isMainEvent;
    if (typeof parent === 'string' && parent.trim() === '') parent = null;
    if (isMain === true) parent = null; // main events cannot have a parent
    if (parent) isMain = false; // if parent specified, it's a sub-event

    // If isMainEvent not explicitly provided, infer from existing event when parent unchanged
    const effectiveIsMain = typeof isMain === 'boolean' ? isMain : event.isMainEvent;

    // Build an update document using $set / $unset to avoid sending empty values
    const updateDoc = { $set: {}, $unset: {} };

    if (name !== undefined) updateDoc.$set.name = name;
    if (description !== undefined) updateDoc.$set.description = description;
    if (imageUrl !== undefined) updateDoc.$set.imageUrl = imageUrl;
    if (department !== undefined) updateDoc.$set.department = department;
    if (registrationDetails !== undefined) updateDoc.$set.registrationDetails = registrationDetails;
    if (eligibleDepartments !== undefined && Array.isArray(eligibleDepartments)) updateDoc.$set.eligibleDepartments = eligibleDepartments;
    if (categories !== undefined && Array.isArray(categories)) updateDoc.$set.categories = categories;
    if (Array.isArray(adminContacts)) updateDoc.$set.adminContacts = adminContacts;
    if (certificateTemplateUrl !== undefined) updateDoc.$set.certificateTemplateUrl = certificateTemplateUrl ?? '';
    if (certificateOrganizer !== undefined) updateDoc.$set.certificateOrganizer = certificateOrganizer ?? '';
    if (certificateAwardText !== undefined) updateDoc.$set.certificateAwardText = certificateAwardText ?? 'Certificate of Participation';
    if (typeof basicRegistrationEnabled === 'boolean') updateDoc.$set.basicRegistrationEnabled = basicRegistrationEnabled;
    if (basicRegistrationAmount !== undefined) updateDoc.$set.basicRegistrationAmount = Number(basicRegistrationAmount || 0);
    if (winnerPrize !== undefined) updateDoc.$set.winnerPrize = Number(winnerPrize || 0);
    if (runnerPrize !== undefined) updateDoc.$set.runnerPrize = Number(runnerPrize || 0);

    // Relationships
    if (isMain !== undefined) updateDoc.$set.isMainEvent = isMain;
    if (parent !== undefined) updateDoc.$set.parentEvent = parent;

    // Normalize date/time/location handling (allow clearing for any event)
    const normalizeClearable = (value, field) => {
      const emptyLike = value === '' || value === null;
      if (value === undefined) return; // not provided
      if (emptyLike) {
        updateDoc.$unset[field] = '';
      } else {
        updateDoc.$set[field] = value;
      }
    };

    normalizeClearable(date, 'date');
    normalizeClearable(time, 'time');
    normalizeClearable(location, 'location');

    // Clean up empty operators
    if (Object.keys(updateDoc.$set).length === 0) delete updateDoc.$set;
    if (Object.keys(updateDoc.$unset).length === 0) delete updateDoc.$unset;

    event = await Event.findByIdAndUpdate(
      req.params.id,
      updateDoc,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email role');

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route DELETE /api/events/:id
// @desc Delete event
// @access Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/complete
// @desc    Mark event as completed and declare winners
// @access  Admin
router.post('/:id/complete', adminAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { winners } = req.body; // Array of { registrationId, position, prizeMoney }
    
    // Update event
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { 
        isCompleted: true,
        completedAt: new Date(),
        $push: { 
          winners: { 
            $each: winners.map(winner => ({
              registrationId: winner.registrationId,
              position: winner.position,
              teamName: winner.teamName,
              participantName: winner.participantName,
              prizeMoney: winner.prizeMoney
            }))
          } 
        }
      },
      { new: true, session }
    );

    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update registrations
    await Promise.all(winners.map(winner => 
      Registration.findByIdAndUpdate(
        winner.registrationId, 
        { 
          winnerStatus: winner.position,
          certificateType: 'achievement'
        },
        { session }
      )
    ));

    // Get all registrations for this event
    const allRegistrations = await Registration.find({ eventId: event._id }, null, { session });
    
    // Send notifications
    const { sendCertificateEmail } = require('../utils/certificateGenerator');
    await Promise.all(allRegistrations.map(async (reg) => {
      const winner = winners.find(w => w.registrationId === reg._id.toString());
      const position = winner ? winner.position : 'none';
      
      try {
        await sendCertificateEmail(event, reg, position);
        reg.certificateSent = true;
        await reg.save({ session });
      } catch (error) {
        console.error(`Failed to send email to ${reg.teamName || reg.teamMembers?.[0]?.email}:`, error);
      }
    }));

    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      success: true, 
      message: 'Event completed successfully. Certificates have been sent to all participants.' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error completing event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/events/:id/winners
// @desc    Get event winners
// @access  Public
router.get('/:id/winners', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('winners.registrationId', 'teamName teamMembers');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      eventName: event.name,
      isCompleted: event.isCompleted,
      completedAt: event.completedAt,
      winners: event.winners.map(winner => ({
        position: winner.position,
        teamName: winner.teamName || winner.registrationId.teamName,
        participantName: winner.participantName,
        prizeMoney: winner.prizeMoney,
        teamMembers: winner.registrationId.teamMembers
      }))
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/events/:id/certificate
// @desc    Download certificate for an event registration
// @access  Private
router.get('/:id/certificate', auth, async (req, res) => {
  try {
    const { registrationId } = req.query;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registration = await Registration.findOne({
      _id: registrationId,
      userId: req.user.id,
      eventId: event._id
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const { generateCertificate } = require('../utils/certificateGenerator');
    const pdfBuffer = await generateCertificate(
      event, 
      registration, 
      registration.winnerStatus !== 'none' ? registration.winnerStatus : 'none'
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${event.name.replace(/\s+/g, '_')}_${registration.winnerStatus || 'participation'}_certificate.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ message: 'Error generating certificate', error: error.message });
  }
});

module.exports = router;
