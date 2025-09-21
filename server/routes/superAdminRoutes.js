const express = require('express');
const { body } = require('express-validator');
const {
  getDashboardStats,
  getAllSalonRequests,
  getExistingSalons,
  getSalonDetails,
  updateSalonStatus,
  approveSalon,
  rejectSalon,
  toggleSalonStatus
} = require('../controllers/superAdminController');
const { protectSuperAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require super admin authentication
router.use(protectSuperAdmin);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// Salon management routes
router.get('/salon-requests', getAllSalonRequests);
router.get('/existing-salons', getExistingSalons);
router.get('/salons/:id', getSalonDetails);

// Salon approval/rejection routes
router.post('/approve-salon/:id', approveSalon);
router.post('/reject-salon/:id', [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], rejectSalon);

// Salon status management
router.put('/salons/:id/status', [
  body('status').isIn(['approved', 'declined', 'hold']).withMessage('Invalid status'),
  body('declineReason').optional().notEmpty().withMessage('Decline reason is required when declining')
], updateSalonStatus);

// Toggle salon active/inactive status
router.patch('/toggle-salon-status/:id', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], toggleSalonStatus);

module.exports = router;