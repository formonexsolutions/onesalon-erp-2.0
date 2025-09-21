const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAnalytics,
  updateLoyaltyPoints,
  createCustomerVisit,
  createCustomerFeedback,
  getCustomerVisits,
  getUpcomingCelebrations
} = require('../controllers/customerController');

// All customer routes are protected
router.use(protect);

// @route   GET /api/customers/analytics
// @desc    Get customer analytics dashboard
router.get('/analytics', getCustomerAnalytics);

// @route   GET /api/customers/celebrations
// @desc    Get customers with upcoming birthdays/anniversaries
router.get('/celebrations', getUpcomingCelebrations);

// @route   GET /api/customers
// @desc    Get all customers for the logged-in salon with pagination and search
router.get('/', getAllCustomers);

// @route   GET /api/customers/:id
// @desc    Get customer by ID with visit history
router.get('/:id', getCustomerById);

// @route   GET /api/customers/:id/visits
// @desc    Get customer visit history
router.get('/:id/visits', getCustomerVisits);

// @route   POST /api/customers
// @desc    Create a new customer
router.post(
  '/',
  [
    check('name', 'Customer name is required').not().isEmpty().trim(),
    check('phoneNumber', 'A valid 10-digit phone number is required').matches(/^[6-9]\d{9}$/),
    check('email', 'Please enter a valid email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    check('dateOfBirth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    check('anniversary', 'Invalid anniversary date').optional({ checkFalsy: true }).isISO8601(),
    check('gender', 'Invalid gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    check('occupation', 'Occupation must be a string').optional().isString().trim(),
    check('address', 'Address must be a string').optional().isString().trim(),
    check('loyaltyTier', 'Invalid loyalty tier').optional().isIn(['bronze', 'silver', 'gold', 'platinum', 'vip']),
    check('preferredServices', 'Preferred services must be an array').optional().isArray(),
    check('skinType', 'Invalid skin type').optional().isIn(['oily', 'dry', 'combination', 'sensitive', 'normal']),
    check('hairType', 'Invalid hair type').optional().isIn(['straight', 'wavy', 'curly', 'coily']),
    check('allergies', 'Allergies must be an array').optional().isArray(),
    check('specialInstructions', 'Special instructions must be a string').optional().isString().trim(),
    check('notes', 'Notes must be a string').optional().isString().trim()
  ],
  createCustomer
);

// @route   PUT /api/customers/:id
// @desc    Update a customer's information
router.put(
  '/:id',
  [
    check('name', 'Customer name is required').optional().not().isEmpty().trim(),
    check('phoneNumber', 'A valid 10-digit phone number is required').optional().matches(/^[6-9]\d{9}$/),
    check('email', 'Please enter a valid email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    check('dateOfBirth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
    check('anniversary', 'Invalid anniversary date').optional({ checkFalsy: true }).isISO8601(),
    check('gender', 'Invalid gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    check('occupation', 'Occupation must be a string').optional().isString().trim(),
    check('address', 'Address must be a string').optional().isString().trim(),
    check('loyaltyTier', 'Invalid loyalty tier').optional().isIn(['bronze', 'silver', 'gold', 'platinum', 'vip']),
    check('preferredServices', 'Preferred services must be an array').optional().isArray(),
    check('skinType', 'Invalid skin type').optional().isIn(['oily', 'dry', 'combination', 'sensitive', 'normal']),
    check('hairType', 'Invalid hair type').optional().isIn(['straight', 'wavy', 'curly', 'coily']),
    check('allergies', 'Allergies must be an array').optional().isArray(),
    check('specialInstructions', 'Special instructions must be a string').optional().isString().trim(),
    check('notes', 'Notes must be a string').optional().isString().trim()
  ],
  updateCustomer
);

// @route   PUT /api/customers/:id/loyalty
// @desc    Update customer loyalty points
router.put(
  '/:id/loyalty',
  [
    check('points', 'Points must be a positive number').isInt({ min: 1 }),
    check('operation', 'Operation must be add or subtract').isIn(['add', 'subtract']),
    check('reason', 'Reason must be a string').optional().isString().trim()
  ],
  updateLoyaltyPoints
);

// @route   POST /api/customers/:id/visits
// @desc    Create customer visit record
router.post(
  '/:id/visits',
  [
    check('visitDate', 'Visit date is required').isISO8601(),
    check('visitType', 'Invalid visit type').isIn(['appointment', 'walkin', 'emergency']),
    check('services', 'Services array is required').isArray({ min: 1 }),
    check('services.*.serviceName', 'Service name is required').not().isEmpty(),
    check('services.*.price', 'Service price must be a positive number').isFloat({ min: 0 }),
    check('totalAmount', 'Total amount must be a positive number').isFloat({ min: 0 }),
    check('paymentStatus', 'Invalid payment status').isIn(['pending', 'partial', 'paid', 'refunded']),
    check('customerRating', 'Customer rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 })
  ],
  createCustomerVisit
);

// @route   POST /api/customers/:id/feedback
// @desc    Create customer feedback
router.post(
  '/:id/feedback',
  [
    check('visit', 'Visit ID is required').isMongoId(),
    check('overallRating', 'Overall rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('serviceQuality', 'Service quality rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    check('staffBehavior', 'Staff behavior rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    check('cleanliness', 'Cleanliness rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
    check('wouldRecommend', 'Would recommend must be a boolean').optional().isBoolean(),
    check('feedbackMethod', 'Invalid feedback method').optional().isIn(['in_person', 'phone', 'email', 'sms', 'app', 'website', 'social_media'])
  ],
  createCustomerFeedback
);

// @route   DELETE /api/customers/:id
// @desc    Deactivate a customer (soft delete)
router.delete('/:id', deleteCustomer);

module.exports = router;