const express = require('express');
const { body } = require('express-validator');
const {
  getStaffAvailability,
  getAvailabilityById,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableSlots,
  checkStaffAvailability,
  createBulkAvailability,
  getStaffSchedule
} = require('../controllers/staffAvailabilityController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get staff schedule overview
router.get('/schedule/:staffId', getStaffSchedule);

// Get available slots for staff
router.get('/:staffId/slots', getAvailableSlots);

// Check staff availability at specific time
router.get('/:staffId/check', checkStaffAvailability);

// Get all staff availability with filtering
router.get('/', getStaffAvailability);

// Get availability by ID
router.get('/:id', getAvailabilityById);

// Create staff availability
router.post('/', [
  body('staff').isMongoId().withMessage('Valid staff ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('isDayOff').optional().isBoolean().withMessage('Day off must be boolean'),
  body('workingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:MM format)'),
  body('workingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:MM format)'),
  body('breaks.*.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid break start time is required'),
  body('breaks.*.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid break end time is required'),
  body('maxBookings').optional().isInt({ min: 1 })
    .withMessage('Max bookings must be a positive integer'),
  body('slotDuration').optional().isInt({ min: 15 })
    .withMessage('Slot duration must be at least 15 minutes')
], createAvailability);

// Create bulk availability
router.post('/bulk', [
  body('staffId').isMongoId().withMessage('Valid staff ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('template').isObject().withMessage('Template object is required'),
  body('excludeDates').optional().isArray().withMessage('Exclude dates must be an array')
], createBulkAvailability);

// Update staff availability
router.put('/:id', [
  body('isDayOff').optional().isBoolean().withMessage('Day off must be boolean'),
  body('workingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:MM format)'),
  body('workingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:MM format)'),
  body('breaks.*.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid break start time is required'),
  body('breaks.*.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid break end time is required'),
  body('maxBookings').optional().isInt({ min: 1 })
    .withMessage('Max bookings must be a positive integer'),
  body('slotDuration').optional().isInt({ min: 15 })
    .withMessage('Slot duration must be at least 15 minutes')
], updateAvailability);

// Delete staff availability
router.delete('/:id', deleteAvailability);

module.exports = router;