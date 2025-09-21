const StaffAvailability = require('../models/StaffAvailability');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

/**
 * @desc    Get staff availability for date range
 * @route   GET /api/staff-availability
 * @access  Private (Salon Staff)
 */
exports.getStaffAvailability = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      staffId,
      page = 1,
      limit = 10
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Build filter object
    let filter = {
      salon: req.user.salonId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (staffId) {
      filter.staff = staffId;
    }

    const availability = await StaffAvailability.find(filter)
      .populate('staff', 'name email position')
      .sort({ date: 1, 'staff.name': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StaffAvailability.countDocuments(filter);

    res.json({
      success: true,
      data: availability,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
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
 * @desc    Get staff availability by ID
 * @route   GET /api/staff-availability/:id
 * @access  Private (Salon Staff)
 */
exports.getAvailabilityById = async (req, res) => {
  try {
    const availability = await StaffAvailability.findOne({
      _id: req.params.id,
      salon: req.user.salonId
    })
    .populate('staff', 'name email position skillLevel');

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }

    res.json({
      success: true,
      data: availability
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create staff availability
 * @route   POST /api/staff-availability
 * @access  Private (Salon Staff)
 */
exports.createAvailability = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const availabilityData = {
      ...req.body,
      salon: req.user.salonId
    };

    // Validate staff exists
    const staff = await Staff.findOne({
      _id: availabilityData.staff,
      salonId: req.user.salonId
    });

    if (!staff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if availability already exists for this staff and date
    const existingAvailability = await StaffAvailability.findOne({
      staff: availabilityData.staff,
      salon: req.user.salonId,
      date: new Date(availabilityData.date)
    });

    if (existingAvailability) {
      return res.status(400).json({
        success: false,
        message: 'Availability already exists for this staff member on this date'
      });
    }

    const availability = new StaffAvailability(availabilityData);
    await availability.save();

    // Populate the created availability
    await availability.populate('staff', 'name email');

    res.status(201).json({
      success: true,
      message: 'Staff availability created successfully',
      data: availability
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
 * @desc    Update staff availability
 * @route   PUT /api/staff-availability/:id
 * @access  Private (Salon Staff)
 */
exports.updateAvailability = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    let availability = await StaffAvailability.findOne({
      _id: req.params.id,
      salon: req.user.salonId
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }

    // Update availability fields
    Object.assign(availability, req.body);
    await availability.save();

    // Populate the updated availability
    await availability.populate('staff', 'name email');

    res.json({
      success: true,
      message: 'Staff availability updated successfully',
      data: availability
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete staff availability
 * @route   DELETE /api/staff-availability/:id
 * @access  Private (Salon Staff)
 */
exports.deleteAvailability = async (req, res) => {
  try {
    const availability = await StaffAvailability.findOne({
      _id: req.params.id,
      salon: req.user.salonId
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }

    await StaffAvailability.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Staff availability deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Staff availability not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get available time slots for staff
 * @route   GET /api/staff-availability/:staffId/slots
 * @access  Private (Salon Staff)
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date, duration = 60 } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate staff exists
    const staff = await Staff.findOne({
      _id: staffId,
      salonId: req.user.salonId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get staff availability for the date
    const availability = await StaffAvailability.findOne({
      staff: staffId,
      salon: req.user.salonId,
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
    const Appointment = require('../models/Appointment');
    const existingAppointments = await Appointment.find({
      $or: [
        { primaryStaff: staffId },
        { 'services.stylistId': staffId }
      ],
      salonId: req.user.salonId,
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
        totalSlots: availableSlots.length,
        staff: staff.name,
        date: new Date(date)
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
 * @desc    Check if staff is available at specific time
 * @route   GET /api/staff-availability/:staffId/check
 * @access  Private (Salon Staff)
 */
exports.checkStaffAvailability = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date, startTime, endTime } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required'
      });
    }

    // Get staff availability for the date
    const availability = await StaffAvailability.findOne({
      staff: staffId,
      salon: req.user.salonId,
      date: new Date(date)
    }).populate('staff', 'name');

    if (!availability) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: 'No availability record found for this date'
        }
      });
    }

    const isAvailable = availability.isAvailableAtTime(startTime, endTime);

    res.json({
      success: true,
      data: {
        available: isAvailable.available,
        reason: isAvailable.reason,
        staff: availability.staff.name,
        date: new Date(date),
        requestedTime: { startTime, endTime }
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
 * @desc    Create bulk availability for staff
 * @route   POST /api/staff-availability/bulk
 * @access  Private (Salon Staff)
 */
exports.createBulkAvailability = async (req, res) => {
  try {
    const { staffId, startDate, endDate, template, excludeDates = [] } = req.body;

    if (!staffId || !startDate || !endDate || !template) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, start date, end date, and template are required'
      });
    }

    // Validate staff exists
    const staff = await Staff.findOne({
      _id: staffId,
      salonId: req.user.salonId
    });

    if (!staff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const availabilityRecords = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const excludeSet = new Set(excludeDates.map(date => new Date(date).toISOString().split('T')[0]));

    // Generate availability records for date range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      
      // Skip if date is in exclude list
      if (excludeSet.has(dateString)) {
        continue;
      }

      // Check if availability already exists
      const existingAvailability = await StaffAvailability.findOne({
        staff: staffId,
        salon: req.user.salonId,
        date: new Date(date)
      });

      if (!existingAvailability) {
        availabilityRecords.push({
          staff: staffId,
          salon: req.user.salonId,
          date: new Date(date),
          ...template
        });
      }
    }

    // Bulk create availability records
    if (availabilityRecords.length > 0) {
      await StaffAvailability.insertMany(availabilityRecords);
    }

    res.status(201).json({
      success: true,
      message: `Created ${availabilityRecords.length} availability records`,
      data: {
        recordsCreated: availabilityRecords.length,
        staffName: staff.name,
        dateRange: { startDate, endDate }
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
 * @desc    Get staff schedule overview
 * @route   GET /api/staff-availability/schedule/:staffId
 * @access  Private (Salon Staff)
 */
exports.getStaffSchedule = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get staff info
    const staff = await Staff.findOne({
      _id: staffId,
      salonId: req.user.salonId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get availability records
    const availability = await StaffAvailability.find({
      staff: staffId,
      salon: req.user.salonId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ date: 1 });

    // Get appointments for the period
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.find({
      $or: [
        { primaryStaff: staffId },
        { 'services.stylistId': staffId }
      ],
      salonId: req.user.salonId,
      appointmentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'] }
    })
    .populate('customerId', 'name')
    .populate('services.serviceId', 'serviceName')
    .sort({ appointmentDate: 1, startTime: 1 });

    // Combine availability and appointments
    const schedule = availability.map(avail => {
      const dayAppointments = appointments.filter(app => 
        app.appointmentDate.toISOString().split('T')[0] === avail.date.toISOString().split('T')[0]
      );

      return {
        date: avail.date,
        isDayOff: avail.isDayOff,
        workingHours: avail.workingHours,
        breaks: avail.breaks,
        appointments: dayAppointments.map(app => ({
          id: app._id,
          startTime: app.startTime,
          endTime: app.endTime,
          customer: app.customerId.name,
          services: app.services.map(s => s.serviceId.serviceName),
          status: app.status
        })),
        totalHours: avail.isDayOff ? 0 : avail.calculateWorkingHours(),
        appointmentCount: dayAppointments.length
      };
    });

    res.json({
      success: true,
      data: {
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          position: staff.position
        },
        schedule,
        summary: {
          totalDays: schedule.length,
          workingDays: schedule.filter(s => !s.isDayOff).length,
          daysOff: schedule.filter(s => s.isDayOff).length,
          totalAppointments: schedule.reduce((sum, s) => sum + s.appointmentCount, 0)
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