// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }, // Stores the hashed password
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }, // User role: 'user' or 'admin'
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    default: 'Prefer not to say'
  }, // NEW: Gender field
  year: {
    type: String,
    default: null
  }, // NEW: Year of student (e.g., "First Year", "Second Year")
  otp: {
    type: String,
    default: null
  }, // NEW: Field to store OTP
  otpExpires: {
    type: Date,
    default: null
  }, // NEW: Field for OTP expiration time
  createdAt: {
    type: Date,
    default: Date.now
  }, // Timestamp for creation
});

// Pre-save hook to hash the password before saving a new user or updating password
userSchema.pre('save', async function(next) {
  // Only hash if the password field is modified (e.g., new user or password change)
  if (!this.isModified('password')) {
    return next();
  }
  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10); // 10 rounds of hashing for security
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Proceed with saving
});

module.exports = mongoose.model('User', userSchema);
