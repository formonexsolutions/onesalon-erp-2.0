const express = require('express');
const { body } = require('express-validator');
const {
  loginSuperAdmin,
  createSuperAdmin,
  changeSuperAdminEmail,
  changeSuperAdminPassword,
  getSuperAdminProfile,
  logoutSuperAdmin
} = require('../controllers/authController');
const { protectSuperAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Super Admin Authentication Routes
router.post('/super-admin/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], loginSuperAdmin);

router.post('/super-admin/create', 
  protectSuperAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  ], 
  createSuperAdmin
);

router.put('/super-admin/change-email',
  protectSuperAdmin,
  [
    body('oldEmail').isEmail().withMessage('Please enter a valid old email'),
    body('newEmail').isEmail().withMessage('Please enter a valid new email'),
    body('otp').notEmpty().withMessage('OTP is required')
  ],
  changeSuperAdminEmail
);

router.put('/super-admin/change-password',
  protectSuperAdmin,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
  ],
  changeSuperAdminPassword
);

router.get('/super-admin/profile', protectSuperAdmin, getSuperAdminProfile);
router.post('/super-admin/logout', protectSuperAdmin, logoutSuperAdmin);

module.exports = router;