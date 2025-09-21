const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const Staff = require('../models/Staff');
const StaffAvailability = require('../models/StaffAvailability');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all appointments with filtering and pagination
 * @route   GET /api/appointments
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      status,
      date,
      customerId,
      staffId,
      sortBy = 'appointmentDate',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    if (staffId) {
      filter.$or = [
        { primaryStaff: staffId },
        { 'services.stylistId': staffId }
      ];
    }

    // Search functionality
    if (search) {
      // We'll use $lookup to search by customer name
      const searchRegex = new RegExp(search, 'i');
      // For now, we'll implement basic search - can be enhanced with aggregation
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get appointments with populated references
    const appointments = await Appointment.find(filter)
      .populate('customerId', 'name phoneNumber email')
      .populate('primaryStaff', 'name email')
      .populate('services.serviceId', 'serviceName price duration')
      .populate('services.stylistId', 'name')
      .populate('additionalServices.serviceId', 'serviceName price duration')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Appointment.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getAppointmentById = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const appointment = await Appointment.findOne({ _id: id, salonId })
      .populate('customerId', 'firstName lastName email phoneNumber address')
      .populate('services.serviceId', 'serviceName category price duration description')
      .populate('services.stylistId', 'firstName lastName email position')
      .populate('additionalServices.serviceId', 'serviceName category price duration')
      .populate('additionalServices.stylistId', 'firstName lastName email position')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Salon Admin/Staff)
 */
exports.createAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const salonId = req.user.salonId;
    const userId = req.user._id;

    const {
      customerId,
      appointmentDate,
      appointmentTime,
      services,
      appointmentType = 'scheduled',
      customerNotes
    } = req.body;

    // Validate customer exists and belongs to salon
    const customer = await Customer.findOne({ _id: customerId, salonId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate services and calculate total duration
    let estimatedDuration = 0;
    const validatedServices = [];

    for (const serviceData of services) {
      const service = await Service.findOne({
        _id: serviceData.serviceId,
        salonId,
        isActive: true
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${serviceData.serviceId}`
        });
      }

      const stylist = await Staff.findOne({
        _id: serviceData.stylistId,
        salonId,
        isActive: true
      });

      if (!stylist) {
        return res.status(404).json({
          success: false,
          message: `Stylist not found: ${serviceData.stylistId}`
        });
      }

      validatedServices.push({
        serviceId: service._id,
        stylistId: stylist._id,
        price: service.price,
        duration: service.duration
      });

      estimatedDuration += service.duration;
    }

    // Check for conflicts (optional - can be enhanced)
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    // Create appointment
    const appointment = new Appointment({
      customerId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      services: validatedServices,
      estimatedDuration,
      appointmentType,
      customerNotes,
      salonId,
      createdBy: userId
    });

    await appointment.save();

    // Populate the created appointment for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId', 'firstName lastName email phoneNumber')
      .populate('services.serviceId', 'serviceName price duration')
      .populate('services.stylistId', 'firstName lastName')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;

    // Find existing appointment
    const existingAppointment = await Appointment.findOne({ _id: id, salonId });
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const {
      appointmentDate,
      appointmentTime,
      services,
      status,
      customerNotes,
      staffNotes,
      actualStartTime,
      actualEndTime
    } = req.body;

    // Update fields
    const updateData = {
      modifiedBy: userId
    };

    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (status) updateData.status = status;
    if (customerNotes) updateData.customerNotes = customerNotes;
    if (staffNotes) updateData.staffNotes = staffNotes;
    if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) updateData.actualEndTime = new Date(actualEndTime);

    // If services are being updated, validate them
    if (services) {
      let estimatedDuration = 0;
      const validatedServices = [];

      for (const serviceData of services) {
        const service = await Service.findOne({
          _id: serviceData.serviceId,
          salonId,
          isActive: true
        });

        if (!service) {
          return res.status(404).json({
            success: false,
            message: `Service not found: ${serviceData.serviceId}`
          });
        }

        const stylist = await Staff.findOne({
          _id: serviceData.stylistId,
          salonId,
          isActive: true
        });

        if (!stylist) {
          return res.status(404).json({
            success: false,
            message: `Stylist not found: ${serviceData.stylistId}`
          });
        }

        validatedServices.push({
          serviceId: service._id,
          stylistId: stylist._id,
          price: service.price,
          duration: service.duration
        });

        estimatedDuration += service.duration;
      }

      updateData.services = validatedServices;
      updateData.estimatedDuration = estimatedDuration;
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email phoneNumber')
     .populate('services.serviceId', 'serviceName price duration')
     .populate('services.stylistId', 'firstName lastName')
     .populate('modifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update appointment status
 * @route   PATCH /api/appointments/:id/status
 * @access  Private (Salon Admin/Staff)
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;
    const { status, staffNotes } = req.body;

    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = {
      status,
      modifiedBy: userId
    };

    if (staffNotes) {
      updateData.staffNotes = staffNotes;
    }

    // Set actual start/end times based on status
    if (status === 'in-progress' && !updateData.actualStartTime) {
      updateData.actualStartTime = new Date();
    }

    if (status === 'completed' && !updateData.actualEndTime) {
      updateData.actualEndTime = new Date();
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, salonId },
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'firstName lastName email phoneNumber')
     .populate('services.serviceId', 'serviceName price duration')
     .populate('services.stylistId', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private (Salon Admin only)
 */
exports.deleteAppointment = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const appointment = await Appointment.findOneAndDelete({ _id: id, salonId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private (Salon Admin/Staff)
 */
exports.getAppointmentStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { period = 'month' } = req.query; // day, week, month, year

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const filter = {
      salonId,
      appointmentDate: { $gte: startDate }
    };

    // Basic counts
    const totalAppointments = await Appointment.countDocuments(filter);
    const confirmedAppointments = await Appointment.countDocuments({
      ...filter,
      status: 'confirmed'
    });
    const completedAppointments = await Appointment.countDocuments({
      ...filter,
      status: 'completed'
    });
    const cancelledAppointments = await Appointment.countDocuments({
      ...filter,
      status: 'cancelled'
    });
    const noShowAppointments = await Appointment.countDocuments({
      ...filter,
      status: 'no-show'
    });

    // Status distribution
    const statusStats = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Appointment type distribution
    const typeStats = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$appointmentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Revenue calculation (from completed appointments)
    const revenueData = await Appointment.aggregate([
      {
        $match: {
          ...filter,
          status: 'completed'
        }
      },
      {
        $unwind: '$services'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$services.price' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.json({
      success: true,
      data: {
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        totalRevenue,
        statusStats,
        typeStats,
        period,
        dateRange: {
          start: startDate,
          end: new Date()
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get available time slots for a date
 * @route   GET /api/appointments/available-slots
 * @access  Private (Salon Admin/Staff)
 */
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { date, stylistId, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    if (!stylistId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    // Get staff availability for the date
    const availability = await StaffAvailability.findOne({
      staff: stylistId,
      salon: salonId,
      date: new Date(date)
    });

    if (!availability || availability.isDayOff) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: 'Staff not available on this date',
          slots: []
        }
      });
    }

    // Get existing appointments for the staff on that date
    const existingAppointments = await Appointment.find({
      $or: [
        { primaryStaff: stylistId },
        { 'services.stylistId': stylistId }
      ],
      salonId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'] }
    }).select('startTime endTime');

    // Get available slots using the model method
    const availableSlots = availability.getAvailableSlots(parseInt(duration), existingAppointments);

    res.json({
      success: true,
      data: {
        available: true,
        slots: availableSlots,
        workingHours: availability.workingHours,
        totalSlots: availableSlots.length
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Cancel appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private (Salon Staff)
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { reason, cancelledBy = 'staff' } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled at this time'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = cancelledBy;
    appointment.modifiedBy = req.user.id;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Reschedule appointment
 * @route   PUT /api/appointments/:id/reschedule
 * @access  Private (Salon Staff)
 */
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { newDate, newTime, reason = 'Schedule change' } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required'
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed or cancelled appointments'
      });
    }

    // Check for conflicts with new time
    const conflicts = await Appointment.findConflicts(
      appointment.primaryStaff,
      new Date(newDate),
      newTime,
      appointment.endTime,
      appointment._id
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'New time slot conflicts with existing appointment',
        conflicts: conflicts
      });
    }

    // Add to reschedule history
    appointment.rescheduleHistory.push({
      originalDate: appointment.appointmentDate,
      originalTime: appointment.appointmentTime,
      newDate: new Date(newDate),
      newTime: newTime,
      reason: reason,
      rescheduledBy: 'staff',
      rescheduledAt: new Date()
    });

    // Update appointment
    appointment.appointmentDate = new Date(newDate);
    appointment.appointmentTime = newTime;
    appointment.modifiedBy = req.user.id;

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get calendar view appointments
 * @route   GET /api/appointments/calendar
 * @access  Private (Salon Staff)
 */
exports.getCalendarView = async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    let filter = {
      salonId: req.user.salonId,
      appointmentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'] }
    };

    if (staffId) {
      filter.$or = [
        { primaryStaff: staffId },
        { 'services.stylistId': staffId }
      ];
    }

    const appointments = await Appointment.find(filter)
      .populate('customerId', 'name phoneNumber')
      .populate('primaryStaff', 'name')
      .populate('services.serviceId', 'serviceName')
      .populate('services.stylistId', 'name')
      .sort({ appointmentDate: 1, startTime: 1 });

    // Format for calendar display
    const calendarEvents = appointments.map(appointment => ({
      id: appointment._id,
      title: `${appointment.customerId.name} - ${appointment.services.map(s => s.serviceId.serviceName).join(', ')}`,
      start: new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.startTime || '09:00'}`),
      end: new Date(`${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.endTime || '10:00'}`),
      resourceId: appointment.primaryStaff._id,
      resourceTitle: appointment.primaryStaff.name,
      status: appointment.status,
      customer: appointment.customerId.name,
      phone: appointment.customerId.phoneNumber,
      services: appointment.services.map(s => s.serviceId.serviceName),
      duration: appointment.estimatedDuration,
      totalAmount: appointment.totalAmount
    }));

    res.json({
      success: true,
      data: calendarEvents
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get appointment analytics
 * @route   GET /api/appointments/analytics
 * @access  Private (Salon Staff)
 */
exports.getAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const salonId = req.user.salonId;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Total appointments
    const totalAppointments = await Appointment.countDocuments({
      salonId,
      appointmentDate: { $gte: start, $lte: end }
    });

    // Appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      {
        $match: {
          salonId: salonId,
          appointmentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue analytics
    const revenueStats = await Appointment.aggregate([
      {
        $match: {
          salonId: salonId,
          appointmentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageAmount: { $avg: '$totalAmount' },
          completedAppointments: { $sum: 1 }
        }
      }
    ]);

    // Staff performance
    const staffPerformance = await Appointment.aggregate([
      {
        $match: {
          salonId: salonId,
          appointmentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$primaryStaff',
          appointmentCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageRating: { $avg: '$customerRating' }
        }
      },
      {
        $lookup: {
          from: 'staff',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      {
        $unwind: '$staff'
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Popular services
    const popularServices = await Appointment.aggregate([
      {
        $match: {
          salonId: salonId,
          appointmentDate: { $gte: start, $lte: end },
          status: 'completed'
        }
      },
      {
        $unwind: '$services'
      },
      {
        $group: {
          _id: '$services.serviceId',
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$services.price' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $unwind: '$service'
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalAppointments,
          completedAppointments: revenueStats[0]?.completedAppointments || 0,
          totalRevenue: revenueStats[0]?.totalRevenue || 0,
          averageAmount: revenueStats[0]?.averageAmount || 0
        },
        statusDistribution: appointmentsByStatus,
        staffPerformance,
        popularServices,
        period: { startDate: start, endDate: end }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create recurring appointment
 * @route   POST /api/appointments/recurring
 * @access  Private (Salon Staff)
 */
exports.createRecurringAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recurringPattern, endDate, ...appointmentData } = req.body;

    if (!recurringPattern || !recurringPattern.frequency) {
      return res.status(400).json({
        success: false,
        message: 'Recurring pattern is required'
      });
    }

    appointmentData.salonId = req.user.salonId;
    appointmentData.createdBy = req.user.id;
    appointmentData.recurringPattern = recurringPattern;

    // Create master appointment
    const masterAppointment = new Appointment(appointmentData);
    await masterAppointment.save();

    // Generate recurring appointments
    const recurringAppointments = [];
    const startDate = new Date(appointmentData.appointmentDate);
    const endRecurringDate = endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    let currentDate = new Date(startDate);
    const interval = recurringPattern.interval || 1;

    while (currentDate <= endRecurringDate && recurringAppointments.length < 52) { // Max 52 occurrences
      // Calculate next occurrence based on frequency
      switch (recurringPattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
        default:
          break;
      }

      if (currentDate <= endRecurringDate) {
        const recurringAppointmentData = {
          ...appointmentData,
          appointmentDate: new Date(currentDate),
          masterAppointmentId: masterAppointment._id,
          isRecurring: true
        };

        recurringAppointments.push(recurringAppointmentData);
      }
    }

    // Bulk create recurring appointments
    if (recurringAppointments.length > 0) {
      await Appointment.insertMany(recurringAppointments);
    }

    res.status(201).json({
      success: true,
      message: `Created master appointment with ${recurringAppointments.length} recurring instances`,
      data: {
        masterAppointment,
        recurringCount: recurringAppointments.length
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};