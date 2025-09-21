const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protectSalonAdmin, protect } = require('../middlewares/authMiddleware');

// Purchase Order validation rules
const purchaseOrderValidationRules = [
  body('supplierId')
    .notEmpty()
    .withMessage('Supplier ID is required'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Expected delivery date must be a valid date'),
  
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
    .withMessage('Notes must not exceed 500 characters'),
  
  body('urgencyLevel')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid urgency level')
];

// Receiving validation rules
const receivingValidationRules = [
  body('receivedItems')
    .isArray({ min: 1 })
    .withMessage('At least one received item is required'),
  
  body('receivedItems.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each received item'),
  
  body('receivedItems.*.receivedQuantity')
    .isInt({ min: 1 })
    .withMessage('Received quantity must be a positive integer'),
  
  body('receivedItems.*.qualityStatus')
    .optional()
    .isIn(['approved', 'rejected', 'pending'])
    .withMessage('Invalid quality status'),
  
  body('receivingNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Receiving notes must not exceed 500 characters'),
  
  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date')
];

// ===================
// PURCHASE ORDER ROUTES
// ===================

// Get all purchase orders with filtering
router.get('/', protect, purchaseOrderController.getAllPurchaseOrders);

// Get single purchase order
router.get('/:id', protect, purchaseOrderController.getPurchaseOrder);

// Create new purchase order
router.post('/', protectSalonAdmin, purchaseOrderValidationRules, purchaseOrderController.createPurchaseOrder);

// Update purchase order
router.put('/:id', protectSalonAdmin, purchaseOrderController.updatePurchaseOrder);

// Delete purchase order (only if not approved/completed)
router.delete('/:id', protectSalonAdmin, purchaseOrderController.cancelPurchaseOrder);

// ===================
// APPROVAL WORKFLOW
// ===================

// Approve purchase order
router.put('/:id/approve', protectSalonAdmin, [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Approval notes must not exceed 500 characters')
], purchaseOrderController.approvePurchaseOrder);

// Reject purchase order
router.put('/:id/reject', protectSalonAdmin, [
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
], purchaseOrderController.rejectPurchaseOrder);

// ===================
// RECEIVING PROCESS
// ===================

// Start receiving process
router.put('/:id/start-receiving', protect, purchaseOrderController.startReceiving);

// Receive items
router.put('/:id/receive', protect, receivingValidationRules, purchaseOrderController.receiveItems);

// Complete purchase order
router.put('/:id/complete', protectSalonAdmin, [
  body('completionNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Completion notes must not exceed 500 characters')
], purchaseOrderController.completePurchaseOrder);

// Cancel purchase order
router.put('/:id/cancel', protectSalonAdmin, [
  body('cancellationReason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters')
], purchaseOrderController.cancelPurchaseOrder);

// ===================
// ANALYTICS & REPORTS
// ===================

// Get purchase order analytics
router.get('/analytics/overview', protectSalonAdmin, purchaseOrderController.getPurchaseOrderAnalytics);

// Generate purchase order reports
router.get('/reports/generate', protectSalonAdmin, purchaseOrderController.generatePurchaseOrderReport);

module.exports = router;