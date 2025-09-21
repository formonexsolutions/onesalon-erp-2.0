const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');

/**
 * @desc    Get staff schedule overview
 * @route   GET /api/schedule/overview
 * @access  Private
 */
const getScheduleOverview = async (req, res) => {
  try {
    const { salonId } = req.user;
    const { date, branchId } = req.query;

    // Set default date to today if not provided
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Build query
    let staffQuery = { salonId, isActive: true };
    if (branchId) {
      staffQuery.branchId = branchId;
    }

    // Get all staff members
    const staff = await Staff.find(staffQuery)
      .populate('branchId', 'branchName')
      .select('name email role workingHours availability branchId');

    // Get appointments for the day
    const appointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'completed', 'in-progress'] }
    }).populate('staffId', 'name')
      .populate('customerId', 'firstName lastName phone')
      .populate('services.serviceId', 'serviceName duration');

    // Create schedule overview for each staff member
    const scheduleOverview = staff.map(staffMember => {
      const staffAppointments = appointments.filter(
        apt => apt.staffId && apt.staffId._id.toString() === staffMember._id.toString()
      );

      // Calculate working hours and utilization
      const workingHours = staffMember.workingHours || { start: '09:00', end: '18:00' };
      const totalWorkingMinutes = calculateWorkingMinutes(workingHours);
      
      const bookedMinutes = staffAppointments.reduce((total, apt) => {
        return total + (apt.services || []).reduce((serviceTotal, service) => {
          return serviceTotal + (service.serviceId?.duration || 60);
        }, 0);
      }, 0);

      const utilization = totalWorkingMinutes > 0 ? (bookedMinutes / totalWorkingMinutes) * 100 : 0;

      return {
        staffId: staffMember._id,
        name: staffMember.name,
        role: staffMember.role,
        branch: staffMember.branchId?.branchName || 'Unknown',
        workingHours,
        appointments: staffAppointments.map(apt => ({
          appointmentId: apt._id,
          time: apt.appointmentTime || '09:00',
          duration: (apt.services || []).reduce((total, service) => total + (service.serviceId?.duration || 60), 0),
          customer: apt.customerId ? `${apt.customerId.firstName} ${apt.customerId.lastName}` : 'Unknown',
          services: (apt.services || []).map(service => service.serviceId?.serviceName || 'Unknown Service'),
          status: apt.status
        })),
        utilization: Math.round(utilization),
        totalAppointments: staffAppointments.length,
        availability: staffMember.availability || 'available'
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      scheduleOverview
    });
  } catch (error) {
    console.error('Error fetching schedule overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule overview',
      error: error.message
    });
  }
};

/**
 * @desc    Update staff schedule
 * @route   PUT /api/schedule/staff/:staffId
 * @access  Private (Manager/Admin)
 */
const updateStaffSchedule = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { workingHours, availability, notes } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Update staff schedule
    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      {
        workingHours,
        availability,
        scheduleNotes: notes,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('branchId', 'branchName');

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff schedule updated successfully',
      staff: {
        staffId: updatedStaff._id,
        name: updatedStaff.name,
        workingHours: updatedStaff.workingHours,
        availability: updatedStaff.availability,
        notes: updatedStaff.scheduleNotes,
        branch: updatedStaff.branchId?.branchName
      }
    });
  } catch (error) {
    console.error('Error updating staff schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff schedule',
      error: error.message
    });
  }
};

/**
 * @desc    Get weekly schedule
 * @route   GET /api/schedule/weekly
 * @access  Private
 */
const getWeeklySchedule = async (req, res) => {
  try {
    const { salonId } = req.user;
    const { startDate, branchId } = req.query;

    // Calculate week start and end
    const weekStart = startDate ? new Date(startDate) : getStartOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Build staff query
    let staffQuery = { salonId, isActive: true };
    if (branchId) {
      staffQuery.branchId = branchId;
    }

    // Get staff members
    const staff = await Staff.find(staffQuery)
      .populate('branchId', 'branchName')
      .select('name role workingHours availability');

    // Get appointments for the week
    const appointments = await Appointment.find({
      salonId,
      appointmentDate: { $gte: weekStart, $lte: weekEnd },
      status: { $in: ['confirmed', 'completed', 'in-progress'] }
    }).populate('staffId', 'name')
      .populate('customerId', 'firstName lastName')
      .populate('services.serviceId', 'serviceName duration');

    // Generate weekly schedule
    const weeklySchedule = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayAppointments = appointments.filter(apt => 
        apt.appointmentDate.toDateString() === currentDate.toDateString()
      );

      const daySchedule = {
        date: currentDate.toISOString().split('T')[0],
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        staff: staff.map(staffMember => {
          const staffAppointments = dayAppointments.filter(
            apt => apt.staffId && apt.staffId._id.toString() === staffMember._id.toString()
          );

          return {
            staffId: staffMember._id,
            name: staffMember.name,
            role: staffMember.role,
            workingHours: staffMember.workingHours || { start: '09:00', end: '18:00' },
            appointments: staffAppointments.map(apt => ({
              appointmentId: apt._id,
              time: apt.appointmentTime || '09:00',
              customer: apt.customerId ? `${apt.customerId.firstName} ${apt.customerId.lastName}` : 'Unknown',
              services: (apt.services || []).map(service => service.serviceId?.serviceName || 'Unknown'),
              duration: (apt.services || []).reduce((total, service) => total + (service.serviceId?.duration || 60), 0),
              status: apt.status
            })),
            availability: staffMember.availability || 'available'
          };
        })
      };

      weeklySchedule.push(daySchedule);
    }

    res.status(200).json({
      success: true,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      weeklySchedule
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly schedule',
      error: error.message
    });
  }
};

/**
 * @desc    Create staff shift
 * @route   POST /api/schedule/shifts
 * @access  Private (Manager/Admin)
 */
const createStaffShift = async (req, res) => {
  try {
    const { staffId, date, startTime, endTime, type, notes } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if staff member exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Create shift data (would normally save to a Shifts collection)
    const shift = {
      staffId,
      date: new Date(date),
      startTime,
      endTime,
      type: type || 'regular', // regular, overtime, holiday
      notes,
      status: 'scheduled',
      createdAt: new Date(),
      createdBy: req.user.id
    };

    // For now, we'll just return success (in real implementation, save to database)
    res.status(201).json({
      success: true,
      message: 'Staff shift created successfully',
      shift: {
        shiftId: 'shift_' + Date.now(),
        staffName: staff.name,
        ...shift
      }
    });
  } catch (error) {
    console.error('Error creating staff shift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create staff shift',
      error: error.message
    });
  }
};

/**
 * @desc    Get staff availability
 * @route   GET /api/schedule/availability/:staffId
 * @access  Private
 */
const getStaffAvailability = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    const staff = await Staff.findById(staffId)
      .select('name workingHours availability');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get target date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get appointments for the day
    const appointments = await Appointment.find({
      staffId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'completed', 'in-progress'] }
    }).populate('services.serviceId', 'duration');

    // Calculate available time slots
    const workingHours = staff.workingHours || { start: '09:00', end: '18:00' };
    const availableSlots = calculateAvailableSlots(workingHours, appointments);

    res.status(200).json({
      success: true,
      staffId,
      staffName: staff.name,
      date: targetDate.toISOString().split('T')[0],
      workingHours,
      availability: staff.availability,
      bookedSlots: appointments.map(apt => ({
        time: apt.appointmentTime,
        duration: (apt.services || []).reduce((total, service) => total + (service.serviceId?.duration || 60), 0)
      })),
      availableSlots
    });
  } catch (error) {
    console.error('Error fetching staff availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff availability',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk update staff schedules
 * @route   PUT /api/schedule/bulk-update
 * @access  Private (Manager/Admin)
 */
const bulkUpdateSchedules = async (req, res) => {
  try {
    const { staffUpdates } = req.body;

    if (!Array.isArray(staffUpdates) || staffUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff updates data'
      });
    }

    const updatePromises = staffUpdates.map(async (update) => {
      try {
        const updatedStaff = await Staff.findByIdAndUpdate(
          update.staffId,
          {
            workingHours: update.workingHours,
            availability: update.availability,
            scheduleNotes: update.notes,
            updatedAt: new Date()
          },
          { new: true }
        );

        return {
          staffId: update.staffId,
          success: true,
          name: updatedStaff?.name || 'Unknown'
        };
      } catch (error) {
        return {
          staffId: update.staffId,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.status(200).json({
      success: true,
      message: `Updated ${successful.length} schedules successfully`,
      results: {
        successful,
        failed,
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error bulk updating schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update schedules',
      error: error.message
    });
  }
};

// Helper functions
function calculateWorkingMinutes(workingHours) {
  const start = parseTime(workingHours.start || '09:00');
  const end = parseTime(workingHours.end || '18:00');
  return (end.hours - start.hours) * 60 + (end.minutes - start.minutes);
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function calculateAvailableSlots(workingHours, appointments, slotDuration = 60) {
  const slots = [];
  const startTime = parseTime(workingHours.start || '09:00');
  const endTime = parseTime(workingHours.end || '18:00');
  
  // Generate time slots
  let current = { ...startTime };
  while (current.hours < endTime.hours || 
         (current.hours === endTime.hours && current.minutes < endTime.minutes)) {
    
    const timeString = `${current.hours.toString().padStart(2, '0')}:${current.minutes.toString().padStart(2, '0')}`;
    
    // Check if this slot is available
    const isBooked = appointments.some(apt => {
      const aptTime = parseTime(apt.appointmentTime || '09:00');
      const aptDuration = (apt.services || []).reduce((total, service) => total + (service.serviceId?.duration || 60), 0);
      const aptEndTime = {
        hours: aptTime.hours + Math.floor(aptDuration / 60),
        minutes: aptTime.minutes + (aptDuration % 60)
      };
      
      if (aptEndTime.minutes >= 60) {
        aptEndTime.hours += 1;
        aptEndTime.minutes -= 60;
      }
      
      // Check if current slot overlaps with appointment
      return (current.hours > aptTime.hours || 
              (current.hours === aptTime.hours && current.minutes >= aptTime.minutes)) &&
             (current.hours < aptEndTime.hours || 
              (current.hours === aptEndTime.hours && current.minutes < aptEndTime.minutes));
    });
    
    if (!isBooked) {
      slots.push(timeString);
    }
    
    // Move to next slot
    current.minutes += slotDuration;
    if (current.minutes >= 60) {
      current.hours += Math.floor(current.minutes / 60);
      current.minutes = current.minutes % 60;
    }
  }
  
  return slots;
}

module.exports = {
  getScheduleOverview,
  updateStaffSchedule,
  getWeeklySchedule,
  createStaffShift,
  getStaffAvailability,
  bulkUpdateSchedules
};