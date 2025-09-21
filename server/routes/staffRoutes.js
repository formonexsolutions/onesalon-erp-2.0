const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const staffController = require('../controllers/staffController');
const { protectSalonAdmin } = require('../middlewares/authMiddleware');

// Staff validation rules
const staffValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['salonadmin', 'branchadmin', 'stylist', 'receptionist', 'manager', 'clerk'])
    .withMessage('Invalid role'),
  
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth format'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('designation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Designation must not exceed 50 characters'),
  
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Specialization must be an array'),
  
  body('specialization.*')
    .optional()
    .isIn(['Hair Dressing', 'Facial', 'Massage', 'Manicure', 'Pedicure', 'Hair Coloring', 'Hair Styling'])
    .withMessage('Invalid specialization'),
  
  body('branchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID'),
  
  body('canReceiveAppointments')
    .optional()
    .isBoolean()
    .withMessage('canReceiveAppointments must be a boolean'),
  
  body('documents.panCard')
    .optional()
    .isLength({ max: 10 })
    .withMessage('PAN card must not exceed 10 characters'),
  
  body('documents.aadhaarCard')
    .optional()
    .isLength({ max: 12 })
    .withMessage('Aadhaar card must not exceed 12 characters')
];

// Staff update validation rules (password not required)
const staffUpdateValidationRules = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['salonadmin', 'branchadmin', 'stylist', 'receptionist', 'manager', 'clerk'])
    .withMessage('Invalid role'),
  
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth format'),
  
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  
  body('designation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Designation must not exceed 50 characters'),
  
  body('specialization')
    .optional()
    .isArray()
    .withMessage('Specialization must be an array'),
  
  body('specialization.*')
    .optional()
    .isIn(['Hair Dressing', 'Facial', 'Massage', 'Manicure', 'Pedicure', 'Hair Coloring', 'Hair Styling'])
    .withMessage('Invalid specialization'),
  
  body('branchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID'),
  
  body('canReceiveAppointments')
    .optional()
    .isBoolean()
    .withMessage('canReceiveAppointments must be a boolean'),
  
  body('documents.panCard')
    .optional()
    .isLength({ max: 10 })
    .withMessage('PAN card must not exceed 10 characters'),
  
  body('documents.aadhaarCard')
    .optional()
    .isLength({ max: 12 })
    .withMessage('Aadhaar card must not exceed 12 characters')
];

// Password update validation
const passwordUpdateValidationRules = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Staff CRUD Routes
router.get('/', protectSalonAdmin, staffController.getAllStaff);
router.get('/stats', protectSalonAdmin, staffController.getStaffStats);
router.get('/performance', protectSalonAdmin, staffController.getStaffPerformance);
router.get('/by-specialization/:specialization', protectSalonAdmin, staffController.getStaffBySpecialization);
router.get('/by-branch/:branchId', protectSalonAdmin, staffController.getStaffByBranch);
router.get('/:id', protectSalonAdmin, staffController.getStaffById);
router.post('/', protectSalonAdmin, staffValidationRules, staffController.createStaff);
router.put('/:id', protectSalonAdmin, staffUpdateValidationRules, staffController.updateStaff);
router.patch('/:id/password', protectSalonAdmin, passwordUpdateValidationRules, staffController.updateStaffPassword);
router.patch('/:id/toggle-status', protectSalonAdmin, staffController.toggleStaffStatus);
router.patch('/:id/toggle-appointments', protectSalonAdmin, staffController.toggleAppointmentAvailability);
router.delete('/:id', protectSalonAdmin, staffController.deleteStaff);

module.exports = router;