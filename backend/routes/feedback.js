const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

// @route GET /api/feedback/event/:eventId
// @desc Get all feedback for an event
// @access Public
router.get('/event/:eventId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ eventId: req.params.eventId })
      .populate('eventId', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = feedback.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = feedback.length > 0 ? (totalRating / feedback.length).toFixed(1) : 0;

    res.json({
      feedback,
      averageRating: parseFloat(averageRating),
      totalFeedback: feedback.length
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/feedback
// @desc Submit feedback for an event
// @access Private
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, rating, review } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user was registered for this event
    // Owner OR team member email on the registration, and payment is completed
    // Additionally: if member emails were not captured, allow match by email local-part vs team member name.
    const userEmail = (req.user?.email || '').toLowerCase();
    const userLocal = userEmail.split('@')[0] || '';
    const registration = await Registration.findOne({
      eventId,
      paymentStatus: 'completed',
      $or: [
        { userId: req.user._id },
        userEmail ? { 'teamMembers.email': userEmail } : { _id: null },
        userLocal ? { 'teamMembers.name': { $regex: new RegExp(`^${userLocal}$`, 'i') } } : { _id: null }
      ]
    });

    if (!registration) {
      return res.status(403).json({ message: 'You must be registered for this event to give feedback' });
    }

    // Check if user already gave feedback
    const existingFeedback = await Feedback.findOne({
      eventId,
      studentRegistrationId: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }

    // Create feedback
    const feedback = new Feedback({
      eventId,
      studentRegistrationId: req.user._id,
      studentDetails: {
        name: req.user.email.split('@')[0], // Use email prefix as name
        email: req.user.email
      },
      rating,
      review
    });

    await feedback.save();
    await feedback.populate('eventId', 'name');

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route PUT /api/feedback/:id
// @desc Update feedback
// @access Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, review } = req.body;

    let feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user owns this feedback
    if (feedback.studentRegistrationId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { rating, review },
      { new: true }
    ).populate('eventId', 'name');

    res.json(feedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route DELETE /api/feedback/:id
// @desc Delete feedback
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Check if user owns this feedback or is admin
    if (feedback.studentRegistrationId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route GET /api/feedback/my-feedback
// @desc Get user's feedback
// @access Private
router.get('/my-feedback', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ studentRegistrationId: req.user._id })
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
