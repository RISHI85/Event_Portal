// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth'); // Import auth middleware
const sendEmail = require('../utils/sendEmail'); // Import email utility
const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit number
};

// Check if email is admin
const isAdminEmail = (email) => {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  return adminEmails.includes(email.toLowerCase());
};

// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post('/register', async (req, res) => {
  const { email, password, gender, year, name = '', phone = '' } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Determine role based on admin emails
    const role = isAdminEmail(email) ? 'admin' : 'user';

    user = new User({
      name,
      email,
      password,
      phone,
      gender,
      year,
      role,
      otp,
      otpExpires
    });

    await user.save();

    // Send OTP email
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Event Portal - Email Verification',
      message: `Your OTP for email verification is: ${otp}. This OTP will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Event Portal!</h2>
          <p>Thank you for registering. Please use the following OTP to verify your email:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Error sending verification email' });
    }

    res.status(201).json({
      msg: 'User registered successfully. Please check your email for OTP verification.',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route POST /api/auth/verify-otp
// @desc Verify OTP
// @access Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT token
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    res.json({
      msg: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name || '',
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        gender: user.gender,
        year: user.year
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route POST /api/auth/login
// @desc Login user
// @access Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate OTP for login verification
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Event Portal - Login Verification',
      message: `Your OTP for login verification is: ${otp}. This OTP will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Event Portal Login</h2>
          <p>Please use the following OTP to complete your login:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please secure your account immediately.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Error sending verification email' });
    }

    res.json({
      msg: 'OTP sent to your email. Please verify to complete login.',
      userId: user._id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route POST /api/auth/resend-otp
// @desc Resend OTP
// @access Public
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Event Portal - New OTP',
      message: `Your new OTP is: ${otp}. This OTP will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New OTP Request</h2>
          <p>Your new OTP for verification is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
        </div>
      `
    });

    if (!emailResult.success) {
      return res.status(500).json({ msg: 'Error sending OTP email' });
    }

    res.json({ msg: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route GET /api/auth/me
// @desc Get current user
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route PUT /api/auth/me
// @desc Update current user's profile and credentials
// @access Private
router.put('/me', auth, async (req, res) => {
  try {
    const { email, gender, year, name, phone, newPassword, currentPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Update simple fields
    if (email) user.email = email.toLowerCase().trim();
    if (gender) user.gender = gender;
    if (typeof year !== 'undefined') user.year = year;
    if (typeof name !== 'undefined') user.name = String(name || '').trim();
    if (typeof phone !== 'undefined') user.phone = String(phone || '').trim();

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ msg: 'Current password is required to set a new password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });
      user.password = newPassword; // will be hashed by pre-save hook
    }

    await user.save();

    const safe = await User.findById(user._id).select('-password -otp -otpExpires');
    res.json({ msg: 'Profile updated', user: safe });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route GET /api/auth/admins
// @desc Get list of admins (public)
// @access Public
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email phone');
    res.json({ count: admins.length, admins });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
