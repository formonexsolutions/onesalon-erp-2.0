const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const scheduleController = require('../controllers/scheduleController');
const { protectSalonAdmin, protect } = require('../middlewares/authMiddleware');

// Schedule validation rules
const scheduleValidationRules = [
  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isMongoId()
    .withMessage('Invalid staff ID'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid start time format (HH:MM)'),
  
  body('endTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid end time format (HH:MM)'),
  
  body('type')
    .optional()
    .isIn(['regular', 'overtime', 'holiday'])
    .withMessage('Invalid schedule type')
];

// --- SCHEDULE MANAGEMENT ROUTES ---

/**
 * @route   GET /api/schedule/overview
 * @desc    Get schedule overview
 * @access  Private (Admin/Manager)
 */
router.get('/overview', protectSalonAdmin, scheduleController.getScheduleOverview);

/**
 * @route   GET /api/schedule/weekly
 * @desc    Get weekly schedule view
 * @access  Private (Admin/Manager)
 */
router.get('/weekly', protectSalonAdmin, scheduleController.getWeeklySchedule);

/**
 * @route   GET /api/schedule/availability/:staffId
 * @desc    Get staff availability
 * @access  Private (Admin/Manager/Staff)
 */
router.get('/availability/:staffId', protect, scheduleController.getStaffAvailability);

/**
 * @route   PUT /api/schedule/staff/:staffId
 * @desc    Update staff schedule
 * @access  Private (Admin/Manager)
 */
router.put('/staff/:staffId', protectSalonAdmin, scheduleController.updateStaffSchedule);

/**
 * @route   POST /api/schedule/shifts
 * @desc    Create staff shift
 * @access  Private (Admin/Manager)
 */
router.post('/shifts', protectSalonAdmin, scheduleValidationRules, scheduleController.createStaffShift);

/**
 * @route   PUT /api/schedule/bulk-update
 * @desc    Bulk update staff schedules
 * @access  Private (Admin/Manager)
 */
router.put('/bulk-update', protectSalonAdmin, scheduleController.bulkUpdateSchedules);

module.exports = router;