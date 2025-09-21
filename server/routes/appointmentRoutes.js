const express = require('express');
const { body } = require('express-validator');
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentStats,
  getAvailableTimeSlots,
  cancelAppointment,
  rescheduleAppointment,
  getCalendarView,
  getAppointmentAnalytics,
  createRecurringAppointment
} = require('../controllers/appointmentController');
const { protectSalonAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require salon admin authentication
router.use(protectSalonAdmin);

// Appointment statistics
router.get('/stats', getAppointmentStats);

// Appointment analytics
router.get('/analytics', getAppointmentAnalytics);

// Calendar view
router.get('/calendar', getCalendarView);

// Available time slots
router.get('/available-slots', getAvailableTimeSlots);

// Get all appointments with filtering and pagination
router.get('/', getAllAppointments);

// Get appointment by ID
router.get('/:id', getAppointmentById);

// Create new appointment
router.post('/', [
  body('customerId').isMongoId().withMessage('Valid customer ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.serviceId').isMongoId().withMessage('Valid service ID is required'),
  body('services.*.stylistId').isMongoId().withMessage('Valid stylist ID is required'),
  body('appointmentType').optional().isIn(['scheduled', 'walkin'])
    .withMessage('Appointment type must be scheduled or walkin'),
  body('customerNotes').optional().isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters')
], createAppointment);

// Create recurring appointment
router.post('/recurring', [
  body('customerId').isMongoId().withMessage('Valid customer ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('recurringPattern.frequency').isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  body('recurringPattern.interval').optional().isInt({ min: 1 })
    .withMessage('Interval must be a positive integer'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required')
], createRecurringAppointment);

// Update appointment
router.put('/:id', [
  body('appointmentDate').optional().isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid appointment time is required (HH:MM format)'),
  body('services').optional().isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.serviceId').optional().isMongoId().withMessage('Valid service ID is required'),
  body('services.*.stylistId').optional().isMongoId().withMessage('Valid stylist ID is required'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('customerNotes').optional().isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters'),
  body('staffNotes').optional().isLength({ max: 500 })
    .withMessage('Staff notes must be less than 500 characters'),
  body('actualStartTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('actualEndTime').optional().isISO8601().withMessage('Valid end time is required')
], updateAppointment);

// Update appointment status
router.patch('/:id/status', [
  body('status').isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('staffNotes').optional().isLength({ max: 500 })
    .withMessage('Staff notes must be less than 500 characters')
], updateAppointmentStatus);

// Cancel appointment
router.put('/:id/cancel', [
  body('reason').notEmpty().withMessage('Cancellation reason is required'),
  body('cancelledBy').optional().isIn(['staff', 'customer'])
    .withMessage('Cancelled by must be staff or customer')
], cancelAppointment);

// Reschedule appointment
router.put('/:id/reschedule', [
  body('newDate').isISO8601().withMessage('Valid new date is required'),
  body('newTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid new time is required (HH:MM format)'),
  body('reason').optional().isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
], rescheduleAppointment);

// Delete appointment
router.delete('/:id', deleteAppointment);

module.exports = router;