const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const { protectSalonAdmin, protect } = require('../middlewares/authMiddleware');

// Supplier validation rules
const supplierValidationRules = [
  body('supplierName')
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  
  body('contactPersonName')
    .notEmpty()
    .withMessage('Contact person name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact person name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('address.street')
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Street address must be between 5 and 100 characters'),
  
  body('address.city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  
  body('address.state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  
  body('address.postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Postal code must be 5-10 digits'),
  
  body('address.country')
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  
  body('category')
    .optional()
    .isIn(['Hair Products', 'Skin Care', 'Equipment', 'Chemicals', 'Furniture', 'Packaging', 'Other'])
    .withMessage('Invalid category'),
  
  body('gstNumber')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Invalid GST number format'),
  
  body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Invalid PAN number format'),
  
  body('paymentTerms')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Payment terms must not exceed 200 characters'),
  
  body('deliveryTerms')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Delivery terms must not exceed 200 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Performance update validation rules
const performanceValidationRules = [
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('reliabilityScore')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Reliability score must be between 1 and 5'),
  
  body('qualityScore')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Quality score must be between 1 and 5'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Performance notes must not exceed 500 characters')
];

// ===================
// SUPPLIER ROUTES
// ===================

// Get all suppliers with filtering and search
router.get('/', protect, supplierController.getAllSuppliers);

// Get single supplier with details and statistics
router.get('/:id', protect, supplierController.getSupplier);

// Create new supplier
router.post('/', protectSalonAdmin, supplierValidationRules, supplierController.createSupplier);

// Update supplier
router.put('/:id', protectSalonAdmin, supplierValidationRules, supplierController.updateSupplier);

// Delete supplier (soft delete)
router.delete('/:id', protectSalonAdmin, supplierController.deleteSupplier);

// ===================
// SUPPLIER RELATIONSHIPS
// ===================

// Get supplier's purchase orders
router.get('/:id/purchase-orders', protect, supplierController.getSupplierPurchaseOrders);

// Get supplier's products
router.get('/:id/products', protect, supplierController.getSupplierProducts);

// ===================
// PERFORMANCE MANAGEMENT
// ===================

// Update supplier performance metrics
router.put('/:id/performance', protectSalonAdmin, performanceValidationRules, supplierController.updateSupplierPerformance);

// ===================
// BULK OPERATIONS
// ===================

// Bulk update supplier status
router.put('/bulk/status', protectSalonAdmin, [
  body('supplierIds')
    .isArray({ min: 1 })
    .withMessage('At least one supplier ID is required'),
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Invalid status value')
], supplierController.bulkUpdateStatus);

// ===================
// ANALYTICS & REPORTS
// ===================

// Get supplier analytics
router.get('/analytics/overview', protectSalonAdmin, supplierController.getSupplierAnalytics);

// Generate supplier reports
router.get('/reports/generate', protectSalonAdmin, supplierController.generateSupplierReport);

module.exports = router;