const mongoose = require('mongoose');

// Define the schema for the feedback.
// This schema will ensure that every feedback document
// contains the required information in a consistent format.
const feedbackSchema = new mongoose.Schema({
  // The event ID to link the feedback to a specific event.
  // It references the 'Event' collection.
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  // The student's registration ID to identify who gave the feedback.
  // It references the 'User' or 'Student' collection.
  studentRegistrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // An embedded object to store key student details.
  // This avoids the need for an extra database lookup when
  // displaying feedback, as the details are readily available.
  studentDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  // The rating given by the student (on a 1-5 scale).
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // The written review provided by the student.
  review: {
    type: String,
    trim: true
  },
  // A timestamp to record when the feedback was submitted.
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Mongoose model.
// The model will be named 'Feedback' and will use the schema we just defined.
module.exports = mongoose.model('Feedback', feedbackSchema);
