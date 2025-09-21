const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
  getServiceStats,
  getServiceCategories,
  getServicePricing,
  checkServiceAvailability,
  getServicesByCategory,
  updateServiceAddOns,
  updateBookingRules
} = require('../controllers/serviceController');

// All service routes are protected
router.use(protect);

// @route   GET /api/services/stats
// @desc    Get service statistics
router.get('/stats', getServiceStats);

// @route   GET /api/services/categories
// @desc    Get service categories
router.get('/categories', getServiceCategories);

// @route   GET /api/services/category/:category
// @desc    Get services by category
router.get('/category/:category', getServicesByCategory);

// @route   GET /api/services/:id/pricing
// @desc    Get service pricing for date
router.get('/:id/pricing', getServicePricing);

// @route   GET /api/services/:id/availability
// @desc    Check service availability
router.get('/:id/availability', checkServiceAvailability);

// @route   GET /api/services
// @desc    Get all services for the logged-in salon with pagination, search, and filtering
router.get('/', getAllServices);

// @route   GET /api/services/:id
// @desc    Get service by ID
router.get('/:id', getServiceById);

// @route   POST /api/services
// @desc    Create a new service
router.post(
  '/',
  [
    check('serviceName', 'Service name is required').not().isEmpty().trim(),
    check('category', 'Category is required').isIn(['male', 'female', 'unisex']),
    check('price', 'Price must be a positive number').isFloat({ min: 0.01 }),
    check('duration', 'Duration must be a positive number (in minutes)').isInt({ min: 1 }),
    check('description', 'Description must be a string').optional().isString().trim(),
    check('isActive', 'Active status must be a boolean').optional().isBoolean()
  ],
  createService
);

// @route   PUT /api/services/:id
// @desc    Update a service's information
router.put(
  '/:id',
  [
    check('serviceName', 'Service name is required').not().isEmpty().trim(),
    check('category', 'Category is required').isIn(['male', 'female', 'unisex']),
    check('price', 'Price must be a positive number').isFloat({ min: 0.01 }),
    check('duration', 'Duration must be a positive number (in minutes)').isInt({ min: 1 }),
    check('description', 'Description must be a string').optional().isString().trim(),
    check('isActive', 'Active status must be a boolean').optional().isBoolean()
  ],
  updateService
);

// @route   PATCH /api/services/:id/toggle-status
// @desc    Toggle service active status
router.patch('/:id/toggle-status', toggleServiceStatus);

// @route   PUT /api/services/:id/addons
// @desc    Update service add-ons
router.put('/:id/addons', updateServiceAddOns);

// @route   PUT /api/services/:id/booking-rules
// @desc    Update service booking rules
router.put('/:id/booking-rules', updateBookingRules);

// @route   DELETE /api/services/:id
// @desc    Delete a service
router.delete('/:id', deleteService);

module.exports = router;