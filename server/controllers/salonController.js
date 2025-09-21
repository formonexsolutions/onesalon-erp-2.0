const Salon = require('../models/Salon');
const Staff = require('../models/Staff');
const Branch = require('../models/Branch'); // Import Branch model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const twilio = require('twilio');
const redisClient = require('../services/redisClient');

// Initialize Twilio Client from .env variables
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// --- Helper Functions ---

// Generates a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Sets the secure cookie and sends the user response
const setLoginCookieAndRespond = async (res, staff) => {
  const token = generateToken(staff.id);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // Expires in 1 day
  });

  // Fetch branches for this salon
  const branches = await Branch.find({
    salonId: staff.salonId,
    status: 'active'
  });

  res.status(200).json({
    _id: staff.id,
    adminName: staff.name,
    role: staff.role,
    salonId: staff.salonId,
    branches: branches
  });
};


// --- Controller Functions ---
/**
 * @desc    Register a new salon AND its first admin user (staff)
 */
exports.registerSalon = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { 
    salonName, 
    adminName, 
    phoneNumber, 
    email,
    password, 
    gst, 
    state, 
    city, 
    area,
    address,
    timingsFrom,
    timingsTo,
    numberOfChairs,
    holidays,
    aboutBranch
  } = req.body;

  try {
    // Check if a staff member with this phone number already exists
    let staffExists = await Staff.findOne({ phoneNumber });
    if (staffExists) {
      return res.status(400).json({ msg: 'A user with this phone number already exists' });
    }

    // Check if email already exists
    let emailExists = await Staff.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ msg: 'A user with this email already exists' });
    }

    // Step 1: Create the Salon entity with pending status
    const newSalon = new Salon({ 
      salonName, 
      adminName,
      phoneNumber,
      email,
      gst, 
      state, 
      city, 
      area,
      address,
      timingsFrom,
      timingsTo,
      numberOfChairs,
      holidays: holidays || [],
      aboutBranch,
      status: 'pending' // Salon needs approval
    });
    await newSalon.save();

    // Step 2: Create the first Staff member (the admin) and link them to the new salon
    const newStaff = new Staff({
      name: adminName,
      phoneNumber,
      email,
      password,
      role: 'salonadmin',
      salonId: newSalon._id,
      gender: 'male', // Default, can be updated later
      isActive: false // Will be activated when salon is approved
    });
    await newStaff.save();

    // Step 3: Return success message (don't auto-login since salon needs approval)
    res.status(201).json({
      msg: 'Salon registration submitted successfully. Your application is under review and you will be notified once approved.',
      salonId: newSalon._id,
      status: 'pending'
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

/**
 * @desc    Authenticate any staff member (admin or otherwise)
 */
exports.loginWithPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phoneNumber, password } = req.body;

  try {
    // Find the staff member and populate salon details
    const staff = await Staff.findOne({ phoneNumber }).populate('salonId');
    if (!staff) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(403).json({ msg: 'Your account is deactivated. Please contact your administrator.' });
    }

    // Check if salon is approved
    if (!staff.salonId || staff.salonId.status !== 'approved') {
      return res.status(403).json({ 
        msg: 'Your salon registration is still under review. You will be notified once approved.',
        salonStatus: staff.salonId?.status || 'unknown'
      });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    setLoginCookieAndRespond(res, staff);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


/**
 * @desc    Generate and send an OTP for login
 * @route   POST /api/salons/login/send-otp
 */
exports.sendLoginOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phoneNumber } = req.body;
  try {
    // Find the staff member and populate salon details
    const staff = await Staff.findOne({ phoneNumber }).populate('salonId');
    if (!staff) {
      return res.status(404).json({ msg: 'User with this phone number not found' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(403).json({ msg: 'Your account is deactivated. Please contact your administrator.' });
    }

    // Check if salon is approved
    if (!staff.salonId || staff.salonId.status !== 'approved') {
      return res.status(403).json({ 
        msg: 'Your salon registration is still under review. You will be notified once approved.',
        salonStatus: staff.salonId?.status || 'unknown'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the OTP in Redis with a 5-minute (300 seconds) expiry
    await redisClient.set(`login-otp:${phoneNumber}`, otp, { EX: 300 });

    // Send the SMS via Twilio
    await twilioClient.messages.create({
      body: `Your OneSalon login code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phoneNumber}`,
    });

    res.status(200).json({ msg: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    res.status(500).send('Server error');
  }
};


/**
 * @desc    Verify OTP and log in the user
 * @route   POST /api/salons/login/verify-otp
 */
exports.verifyOtpAndLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phoneNumber, otp } = req.body;
  try {
    const storedOtp = await redisClient.get(`login-otp:${phoneNumber}`);
    
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    
    // Find the staff member and populate salon details
    const staff = await Staff.findOne({ phoneNumber }).populate('salonId');
    if (!staff) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(403).json({ msg: 'Your account is deactivated. Please contact your administrator.' });
    }

    // Check if salon is approved
    if (!staff.salonId || staff.salonId.status !== 'approved') {
      return res.status(403).json({ 
        msg: 'Your salon registration is still under review. You will be notified once approved.',
        salonStatus: staff.salonId?.status || 'unknown'
      });
    }
    
    await redisClient.del(`login-otp:${phoneNumber}`);
    
    setLoginCookieAndRespond(res, staff);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};


/**
 * @desc    Get the logged-in salon's profile
 * @route   GET /api/salons/profile
 */
exports.getSalonProfile = async (req, res) => {
  if (req.salon) {
    res.json(req.salon);
  } else {
    res.status(404).json({ msg: 'Salon not found' });
  }
};

/**
 * @desc    Log out a salon admin
 * @route   POST /api/salons/logout
 * @access  Public
 */
exports.logoutSalon = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Set expiration date to the past to delete it
  });
  res.status(200).json({ msg: 'Successfully logged out' });
};