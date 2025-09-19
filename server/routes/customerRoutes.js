const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const {
  createCustomer,
  getCustomersForSalon,
  updateCustomer, // We'll need these later
  deleteCustomer, //
} = require('../controllers/customerController');

// All customer routes are protected
router.use(protect);

// @route   POST /api/customers
// @desc    Create a new customer
router.post(
  '/',
  [
    // Required fields
    check('name', 'Customer name is required').not().isEmpty(),
    check('phoneNumber', 'A valid 10-digit phone number is required').matches(/^[6-9]\d{9}$/),

    // ✅ OPTIONAL fields, correctly configured
    check('email', 'Please enter a valid email').optional({ checkFalsy: true }).isEmail(),
    check('address', 'Address must be a string').optional().isString(),
    check('notes', 'Notes must be a string').optional().isString(),
  ],
  createCustomer
);

// @route   GET /api/customers
// @desc    Get all customers for the logged-in salon
router.get('/', getCustomersForSalon);

/**
 * @route   PUT /api/customers/:customerId
 * @desc    Update a customer's information
 * @access  Private
 */
router.put(
  '/:customerId',
  [ // Validation for the update
    check('name', 'Customer name is required').not().isEmpty(),
    check('phoneNumber', 'A valid phone number is required').matches(/^[6-9]\d{9}$/),
    check('email', 'Please enter a valid email').optional({ checkFalsy: true }).isEmail(),
    check('address', 'Address must be a string').optional().isString(),
    check('notes', 'Notes must be a string').optional().isString(),
  ],
  updateCustomer
);

module.exports = router;