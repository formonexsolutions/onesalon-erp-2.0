const express = require('express');
const { body } = require('express-validator');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  getEmployeeStats
} = require('../controllers/employeeController');
const { protectSalonAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require salon admin authentication
router.use(protectSalonAdmin);

// Employee statistics
router.get('/stats', getEmployeeStats);

// Get all employees with filtering and pagination
router.get('/', getAllEmployees);

// Get employee by ID
router.get('/:id', getEmployeeById);

// Create new employee
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('role').isIn(['stylist', 'barber', 'receptionist', 'manager', 'assistant'])
    .withMessage('Valid role is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('dateOfJoining').isISO8601().withMessage('Valid date of joining is required'),
  body('salary').isNumeric().withMessage('Valid salary is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').isMobilePhone().withMessage('Valid emergency contact phone is required')
], createEmployee);

// Update employee
router.put('/:id', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('role').isIn(['stylist', 'barber', 'receptionist', 'manager', 'assistant'])
    .withMessage('Valid role is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('dateOfJoining').isISO8601().withMessage('Valid date of joining is required'),
  body('salary').isNumeric().withMessage('Valid salary is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.zipCode').notEmpty().withMessage('ZIP code is required'),
  body('emergencyContact.name').notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').isMobilePhone().withMessage('Valid emergency contact phone is required')
], updateEmployee);

// Toggle employee active status
router.patch('/:id/toggle-status', toggleEmployeeStatus);

// Delete employee
router.delete('/:id', deleteEmployee);

module.exports = router;