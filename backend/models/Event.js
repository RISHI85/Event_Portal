// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: null
  },
  time: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  }, // URL for the event image
  isMainEvent: {
    type: Boolean,
    default: true
  },
  parentEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null,
  },
  department: {
    type: String,
    default: null,
    trim: true
  },
  // Which departments are eligible to participate in this event (optional)
  eligibleDepartments: {
    type: [String],
    default: [],
  },
  // Event categories (Technical, Coding, Robotics, Innovation, Group Events)
  categories: {
    type: [String],
    default: [],
    enum: ['Technical', 'Coding', 'Robotics', 'Innovation', 'Group Events'],
  },
  registrationDetails: {
    feePerHead: {
      type: Number,
      default: 0,
      min: 0
    },
    teamParticipation: {
      type: Boolean,
      default: false
    },
    teamSize: {
      type: {
        type: String,
        enum: ['fixed', 'range', 'at_most', 'at_least', 'individual'],
        default: 'individual',
      },
      value: {
        type: Number,
        default: 1,
        min: 1
      },
      minValue: {
        type: Number,
        default: 1,
        min: 1
      },
      maxValue: {
        type: Number,
        default: 1,
        min: 1
      },
    },
  },
  adminContacts: [
    {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
    }
  ],
  // Certificate configuration (optional)
  certificateTemplateUrl: { type: String, default: '' },
  certificateOrganizer: { type: String, default: '' },
  certificateAwardText: { type: String, default: 'Certificate of Participation' },
  // Basic registration for main events (optional)
  basicRegistrationEnabled: {
    type: Boolean,
    default: false,
  },
  basicRegistrationAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model('Event', eventSchema);
