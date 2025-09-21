const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Set login cookie and respond
const setLoginCookieAndRespond = (res, user) => {
  const token = generateToken(user.id);
  res.cookie('superAdminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

/**
 * @desc    Login Super Admin
 * @route   POST /api/auth/super-admin/login
 * @access  Public
 */
exports.loginSuperAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: 'superadmin' });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    setLoginCookieAndRespond(res, user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Create new Super Admin
 * @route   POST /api/auth/super-admin/create
 * @access  Private (Super Admin only)
 */
exports.createSuperAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new super admin
    user = new User({
      name,
      email,
      password,
      role: 'superadmin',
      createdBy: req.user.id
    });

    await user.save();

    res.status(201).json({ msg: 'Super Admin created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Change Super Admin Email
 * @route   PUT /api/auth/super-admin/change-email
 * @access  Private (Super Admin only)
 */
exports.changeSuperAdminEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { oldEmail, newEmail, otp } = req.body;

  try {
    // Verify OTP logic would go here
    // For now, we'll assume OTP is verified

    const user = await User.findById(req.user.id);
    if (!user || user.email !== oldEmail) {
      return res.status(400).json({ msg: 'Invalid old email' });
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    user.email = newEmail;
    user.modifiedBy = req.user.id;
    await user.save();

    res.status(200).json({ msg: 'Email updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Change Super Admin Password
 * @route   PUT /api/auth/super-admin/change-password
 * @access  Private (Super Admin only)
 */
exports.changeSuperAdminPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid old password' });
    }

    user.password = newPassword; // Will be hashed by pre-save middleware
    user.modifiedBy = req.user.id;
    await user.save();

    res.status(200).json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Get Super Admin Profile
 * @route   GET /api/auth/super-admin/profile
 * @access  Private (Super Admin only)
 */
exports.getSuperAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Logout Super Admin
 * @route   POST /api/auth/super-admin/logout
 * @access  Private
 */
exports.logoutSuperAdmin = (req, res) => {
  res.cookie('superAdminToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ msg: 'Successfully logged out' });
};