const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const financialController = require('../controllers/financialController');
const { protectSalonAdmin } = require('../middlewares/authMiddleware');

// Bill validation rules
const billValidationRules = [
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isMongoId()
    .withMessage('Invalid customer ID'),
  
  body('appointmentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid appointment ID'),
  
  body('services')
    .isArray({ min: 1 })
    .withMessage('At least one service is required'),
  
  body('services.*.serviceId')
    .notEmpty()
    .withMessage('Service ID is required')
    .isMongoId()
    .withMessage('Invalid service ID'),
  
  body('services.*.serviceName')
    .notEmpty()
    .withMessage('Service name is required'),
  
  body('services.*.price')
    .isFloat({ min: 0 })
    .withMessage('Service price must be a positive number'),
  
  body('services.*.stylistId')
    .notEmpty()
    .withMessage('Stylist ID is required')
    .isMongoId()
    .withMessage('Invalid stylist ID'),
  
  body('products')
    .optional()
    .isArray()
    .withMessage('Products must be an array'),
  
  body('products.*.productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('products.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Product quantity must be at least 1'),
  
  body('products.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Product unit price must be a positive number'),
  
  body('subtotal')
    .isFloat({ min: 0 })
    .withMessage('Subtotal must be a positive number'),
  
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'wallet', 'bank-transfer'])
    .withMessage('Invalid payment method'),
  
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'partial', 'refunded'])
    .withMessage('Invalid payment status')
];

// Payment validation rules
const paymentValidationRules = [
  body('billId')
    .notEmpty()
    .withMessage('Bill ID is required')
    .isMongoId()
    .withMessage('Invalid bill ID'),
  
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isMongoId()
    .withMessage('Invalid customer ID'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'dd'])
    .withMessage('Invalid payment method'),
  
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid payment date format'),
  
  body('cardDetails.cardType')
    .optional()
    .isIn(['credit', 'debit'])
    .withMessage('Invalid card type'),
  
  body('cardDetails.last4Digits')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Last 4 digits must be exactly 4 characters'),
  
  body('upiDetails.upiId')
    .optional()
    .isEmail()
    .withMessage('Invalid UPI ID format'),
  
  body('chequeDetails.chequeNumber')
    .optional()
    .isLength({ min: 6, max: 10 })
    .withMessage('Cheque number must be between 6-10 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Expense validation rules
const expenseValidationRules = [
  body('title')
    .notEmpty()
    .withMessage('Expense title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3-100 characters'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'rent', 'utilities', 'supplies', 'equipment', 'marketing', 
      'staff_salary', 'staff_incentive', 'maintenance', 'insurance', 
      'license_fees', 'training', 'travel', 'food', 'miscellaneous'
    ])
    .withMessage('Invalid expense category'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'netbanking', 'cheque', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  
  body('expenseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expense date format'),
  
  body('vendorName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Vendor name must not exceed 100 characters'),
  
  body('vendorPhone')
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Invalid vendor phone number'),
  
  body('vendorEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid vendor email'),
  
  body('billNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Bill number must not exceed 50 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

// Payment update validation
const paymentUpdateValidationRules = [
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'wallet', 'bank-transfer'])
    .withMessage('Invalid payment method'),
  
  body('paidAmount')
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number'),
  
  body('paymentStatus')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['pending', 'paid', 'partial', 'refunded'])
    .withMessage('Invalid payment status')
];

// --- BILL ROUTES ---
router.get('/bills', protectSalonAdmin, financialController.getAllBills);
router.get('/bills/:id', protectSalonAdmin, financialController.getBillById);
router.post('/bills', protectSalonAdmin, billValidationRules, financialController.createBill);
router.patch('/bills/:id/payment', protectSalonAdmin, paymentUpdateValidationRules, financialController.updateBillPayment);

// --- PAYMENT ROUTES ---
router.get('/payments', protectSalonAdmin, financialController.getAllPayments);
router.post('/payments', protectSalonAdmin, paymentValidationRules, financialController.createPayment);

// --- EXPENSE ROUTES ---
router.get('/expenses', protectSalonAdmin, financialController.getAllExpenses);
router.get('/expenses/stats', protectSalonAdmin, financialController.getExpenseStats);
router.post('/expenses', protectSalonAdmin, expenseValidationRules, financialController.createExpense);

// --- DASHBOARD ROUTES ---
router.get('/dashboard', protectSalonAdmin, financialController.getFinancialDashboard);

module.exports = router;