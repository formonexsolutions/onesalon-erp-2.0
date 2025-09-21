const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const stockMovementController = require('../controllers/stockMovementController');
const { protectSalonAdmin, protect } = require('../middlewares/authMiddleware');

// Stock movement validation rules
const stockMovementValidationRules = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('movementType')
    .notEmpty()
    .withMessage('Movement type is required')
    .isIn([
      'purchase_receipt', 'consumption', 'sales', 'waste', 
      'adjustment_positive', 'adjustment_negative', 'transfer_in', 
      'transfer_out', 'return', 'damage'
    ])
    .withMessage('Invalid movement type'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  body('unitCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a positive number'),
  
  body('referenceType')
    .optional()
    .isIn(['purchase_order', 'appointment', 'manual_adjustment', 'stock_transfer'])
    .withMessage('Invalid reference type'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  
  body('batchNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number must not exceed 50 characters'),
  
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
];

// Approval validation rules
const approvalValidationRules = [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Approval notes must not exceed 500 characters')
];

// Rejection validation rules
const rejectionValidationRules = [
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
];

// Reversal validation rules
const reversalValidationRules = [
  body('reversalReason')
    .notEmpty()
    .withMessage('Reversal reason is required')
    .isLength({ max: 500 })
    .withMessage('Reversal reason must not exceed 500 characters')
];

// ===================
// STOCK MOVEMENT ROUTES
// ===================

// Get all stock movements with filtering
router.get('/', protect, stockMovementController.getAllStockMovements);

// Get single stock movement
router.get('/:id', protect, stockMovementController.getStockMovement);

// Create manual stock movement
router.post('/', protectSalonAdmin, stockMovementValidationRules, stockMovementController.createStockMovement);

// ===================
// APPROVAL WORKFLOW
// ===================

// Approve stock movement
router.put('/:id/approve', protectSalonAdmin, approvalValidationRules, stockMovementController.approveStockMovement);

// Reject stock movement
router.put('/:id/reject', protectSalonAdmin, rejectionValidationRules, stockMovementController.rejectStockMovement);

// Reverse stock movement
router.put('/:id/reverse', protectSalonAdmin, reversalValidationRules, stockMovementController.reverseStockMovement);

// ===================
// BULK OPERATIONS
// ===================

// Bulk approve stock movements
router.put('/bulk/approve', protectSalonAdmin, [
  body('movementIds')
    .isArray({ min: 1 })
    .withMessage('At least one movement ID is required'),
  body('approvalNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Approval notes must not exceed 500 characters')
], stockMovementController.bulkApproveMovements);

// ===================
// ANALYTICS & REPORTS
// ===================

// Get stock movement analytics
router.get('/analytics/overview', protectSalonAdmin, stockMovementController.getStockMovementAnalytics);

// Get product stock history
router.get('/product/:productId/history', protect, stockMovementController.getProductStockHistory);

// Generate stock movement reports
router.get('/reports/generate', protectSalonAdmin, stockMovementController.generateStockMovementReport);

module.exports = router;