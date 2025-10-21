// models/Registration.js
const mongoose = require('mongoose');
const User = require('./User'); // NEW: Import User model for population

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }, // Reference to the registered event
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, // Reference to the user who registered

  department: {
    type: String,
    default: null,
    trim: true
  }, // User's department for registration (if applicable)
  year: {
    type: String,
    default: null,
    trim: true
  }, // Academic year filled in the registration form
  teamName: {
    type: String,
    default: null,
    trim: true
  }, // Name of the team (if team participation)
  teamMembers: [{ // Array of team members (if team participation)
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    }
  }],

  totalFee: {
    type: Number,
    required: true,
    min: 0
  }, // Calculated total fee for registration
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  stripe_payment_intent_id: {
    type: String,
    default: null
  }, // NEW: Stripe Payment Intent ID
  stripe_payment_id: {
    type: String,
    default: null
  }, // NEW: Stripe Payment ID (from webhook)
  stripe_session_id: {
    type: String,
    default: null
  }, // Stripe Checkout Session ID
  registrationType: {
    type: String,
    enum: ['internal', 'external'],
    required: true
  }, // Internal (@gmrit.edu.in) or External
  registeredAt: {
    type: Date,
    default: Date.now
  }, // Timestamp for registration
  emailSent: {
    type: Boolean,
    default: false
  }, // Whether confirmation email has been sent
  failureEmailSent: {
    type: Boolean,
    default: false
  }, // Whether a failure/timeout email has been sent
});

module.exports = mongoose.model('Registration', registrationSchema);
