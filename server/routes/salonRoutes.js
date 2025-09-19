const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  registerSalon,
  loginWithPassword,
  sendLoginOtp,
  verifyOtpAndLogin,
  getSalonProfile,
  logoutSalon,
} = require('../controllers/salonController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/salons/register
 * @desc    Register a new salon
 * @access  Public
 */
router.post(
  '/register',
  [
    check('salonName', 'Salon name is required').not().isEmpty(),
    check('adminName', 'Admin name is required').not().isEmpty(),
    check('phoneNumber', 'Please include a valid 10-digit phone number').matches(/^[6-9]\d{9}$/),
    check('password', 'Password must be at least 8 characters long').isLength({ min: 8 }),
    check('state', 'State is required').not().isEmpty(),
    check('city', 'City is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
  ],
  registerSalon
);

/**
 * @route   POST /api/salons/login/password
 * @desc    Authenticate with password
 * @access  Public
 */
router.post(
  '/login/password',
  [
    check('phoneNumber', 'Please include a valid phone number').not().isEmpty(),
    check('password', 'Password is required').exists(),
  ],
  loginWithPassword
);

/**
 * @route   POST /api/salons/login/send-otp
 * @desc    Send a login OTP
 * @access  Public
 */
router.post(
  '/login/send-otp',
  [check('phoneNumber', 'Please include a valid phone number').matches(/^[6-9]\d{9}$/)],
  sendLoginOtp
);

/**
 * @route   POST /api/salons/login/verify-otp
 * @desc    Verify OTP and log in
 * @access  Public
 */
router.post(
  '/login/verify-otp',
  [
    check('phoneNumber', 'Phone number is required').not().isEmpty(),
    check('otp', 'OTP must be a 6-digit number').isLength({ min: 6, max: 6 }),
  ],
  verifyOtpAndLogin
);

/**
 * @route   POST /api/salons/logout
 * @desc    Log out a salon admin
 * @access  Public
 */
router.post('/logout', logoutSalon);

/**
 * @route   GET /api/salons/profile
 * @desc    Get logged-in salon's profile (Protected)
 * @access  Private
 */
router.get('/profile', protect, getSalonProfile);

module.exports = router;