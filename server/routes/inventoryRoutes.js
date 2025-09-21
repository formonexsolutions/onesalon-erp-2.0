const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const { protectSalonAdmin, protect } = require('../middlewares/authMiddleware');

// Product validation rules
const productValidationRules = [
  body('productName')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Hair Care', 'Skin Care', 'Nail Care', 'Tools & Equipment', 'Styling Products', 'Color Products', 'Other'])
    .withMessage('Invalid category'),
  
  body('costPrice')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  
  body('maxStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock must be a non-negative integer'),
  
  body('currentStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
  
  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .isIn(['piece', 'bottle', 'tube', 'jar', 'pack', 'ml', 'g', 'kg', 'liter'])
    .withMessage('Invalid unit'),
  
  body('barcode')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('Barcode must be between 8 and 20 characters'),
  
  body('brand')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Brand must not exceed 50 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

// Stock movement validation rules
const stockMovementValidationRules = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters')
];

// ===================
// PRODUCT ROUTES
// ===================
router.get('/products', protect, inventoryController.getAllProducts);
router.get('/products/:id', protect, inventoryController.getProductById);
router.post('/products', protectSalonAdmin, productValidationRules, inventoryController.createProduct);
router.put('/products/:id', protectSalonAdmin, productValidationRules, inventoryController.updateProduct);
router.delete('/products/:id', protectSalonAdmin, inventoryController.deleteProduct);

// Product stock operations
router.patch('/products/:id/stock/add', protect, inventoryController.addProductStock);
router.patch('/products/:id/stock/consume', protect, inventoryController.consumeProductStock);

// Product analytics
router.get('/products/:id/analytics', protectSalonAdmin, inventoryController.getProductAnalytics);
router.get('/products/:id/history', protect, inventoryController.getProductStockHistory);

// ===================
// INVENTORY OVERVIEW ROUTES
// ===================
router.get('/stats', protect, inventoryController.getInventoryStats);
router.get('/low-stock', protect, inventoryController.getLowStockProducts);
router.get('/expiring-soon', protect, inventoryController.getExpiringSoonProducts);
router.get('/analytics', protectSalonAdmin, inventoryController.getInventoryAnalytics);

// ===================
// STOCK OPERATIONS
// ===================
router.post('/consume-stock', protect, stockMovementValidationRules, inventoryController.consumeStock);
router.post('/adjust-stock', protectSalonAdmin, stockMovementValidationRules, inventoryController.adjustStock);

// ===================
// STOCK MOVEMENTS
// ===================
router.get('/stock-movements', protect, inventoryController.getStockMovements);

// ===================
// PURCHASE ORDERS (Basic in inventory routes)
// ===================
router.get('/purchase-orders', protect, inventoryController.getAllPurchaseOrders);
router.post('/purchase-orders', protectSalonAdmin, inventoryController.createPurchaseOrder);
router.put('/purchase-orders/:id/receive', protect, inventoryController.receivePurchaseOrder);

module.exports = router;