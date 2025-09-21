const Staff = require('../models/Staff');
const Salon = require('../models/Salon');
const Branch = require('../models/Branch');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all staff members with filtering and pagination
 * @route   GET /api/staff
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllStaff = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      role,
      branchId,
      isActive,
      specialization,
      sortBy = 'name',
      sortOrder = 'asc',
      search
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (role) {
      filter.role = role;
    }

    if (branchId) {
      filter.branchId = branchId;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (specialization) {
      filter.specialization = { $in: [specialization] };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get staff members
    const staff = await Staff.find(filter)
      .populate('salonId', 'salonName')
      .populate('branchId', 'branchName location')
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password'); // Exclude password from response

    // Get total count for pagination
    const total = await Staff.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: staff,
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
 * @desc    Get staff member by ID
 * @route   GET /api/staff/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getStaffById = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, salonId })
      .populate('salonId', 'salonName')
      .populate('branchId', 'branchName location')
      .populate('createdBy', 'name email')
      .populate('modifiedBy', 'name email')
      .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
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
 * @desc    Create new staff member
 * @route   POST /api/staff
 * @access  Private (Salon Admin)
 */
exports.createStaff = async (req, res) => {
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
      name,
      phoneNumber,
      email,
      username,
      password,
      role,
      gender,
      dateOfBirth,
      address,
      documents,
      designation,
      specialization,
      branchId,
      canReceiveAppointments
    } = req.body;

    // Check if staff with same phone number already exists
    const existingStaff = await Staff.findOne({ 
      $or: [
        { phoneNumber, salonId },
        { email, salonId },
        { username }
      ]
    });
    
    if (existingStaff) {
      let conflictField = 'phone number';
      if (existingStaff.email === email) conflictField = 'email';
      if (existingStaff.username === username) conflictField = 'username';
      
      return res.status(400).json({
        success: false,
        message: `Staff member with this ${conflictField} already exists`
      });
    }

    // Validate branch if provided
    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, salonId });
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch selected'
        });
      }
    }

    // Create staff member
    const staff = new Staff({
      name,
      phoneNumber,
      email,
      username,
      password, // Will be hashed by pre-save middleware
      role,
      gender,
      dateOfBirth,
      address,
      documents,
      designation,
      specialization: specialization || [],
      salonId,
      branchId: branchId || null,
      canReceiveAppointments: canReceiveAppointments !== undefined ? canReceiveAppointments : true,
      createdBy: userId
    });

    await staff.save();

    const populatedStaff = await Staff.findById(staff._id)
      .populate('salonId', 'salonName')
      .populate('branchId', 'branchName location')
      .populate('createdBy', 'name')
      .select('-password');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: populatedStaff
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
 * @desc    Update staff member
 * @route   PUT /api/staff/:id
 * @access  Private (Salon Admin)
 */
exports.updateStaff = async (req, res) => {
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

    // Find existing staff member
    const existingStaff = await Staff.findOne({ _id: id, salonId });
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const {
      name,
      phoneNumber,
      email,
      username,
      role,
      gender,
      dateOfBirth,
      address,
      documents,
      designation,
      specialization,
      branchId,
      canReceiveAppointments
    } = req.body;

    // Check for conflicts with other staff members
    const conflictQuery = {
      salonId,
      _id: { $ne: id },
      $or: []
    };

    if (phoneNumber !== existingStaff.phoneNumber) {
      conflictQuery.$or.push({ phoneNumber });
    }
    if (email !== existingStaff.email) {
      conflictQuery.$or.push({ email });
    }
    if (username !== existingStaff.username) {
      conflictQuery.$or.push({ username });
    }

    if (conflictQuery.$or.length > 0) {
      const conflictingStaff = await Staff.findOne(conflictQuery);
      if (conflictingStaff) {
        let conflictField = 'phone number';
        if (conflictingStaff.email === email) conflictField = 'email';
        if (conflictingStaff.username === username) conflictField = 'username';
        
        return res.status(400).json({
          success: false,
          message: `Another staff member with this ${conflictField} already exists`
        });
      }
    }

    // Validate branch if provided
    if (branchId && branchId !== existingStaff.branchId?.toString()) {
      const branch = await Branch.findOne({ _id: branchId, salonId });
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch selected'
        });
      }
    }

    // Update staff member
    const updateData = {
      name,
      phoneNumber,
      email,
      username,
      role,
      gender,
      dateOfBirth,
      address,
      documents,
      designation,
      specialization: specialization || [],
      branchId: branchId || null,
      canReceiveAppointments: canReceiveAppointments !== undefined ? canReceiveAppointments : existingStaff.canReceiveAppointments,
      modifiedBy: userId
    };

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('salonId', 'salonName')
    .populate('branchId', 'branchName location')
    .populate('modifiedBy', 'name')
    .select('-password');

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
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
 * @desc    Update staff password
 * @route   PATCH /api/staff/:id/password
 * @access  Private (Salon Admin)
 */
exports.updateStaffPassword = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const staff = await Staff.findOne({ _id: id, salonId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    staff.password = hashedPassword;
    staff.modifiedBy = userId;
    await staff.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
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
 * @desc    Toggle staff active status
 * @route   PATCH /api/staff/:id/toggle-status
 * @access  Private (Salon Admin)
 */
exports.toggleStaffStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, salonId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Toggle active status
    staff.isActive = !staff.isActive;
    staff.modifiedBy = userId;
    await staff.save();

    res.json({
      success: true,
      message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        staffId: staff._id,
        name: staff.name,
        isActive: staff.isActive
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
 * @desc    Toggle staff appointment availability
 * @route   PATCH /api/staff/:id/toggle-appointments
 * @access  Private (Salon Admin)
 */
exports.toggleAppointmentAvailability = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, salonId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Toggle appointment availability
    staff.canReceiveAppointments = !staff.canReceiveAppointments;
    staff.modifiedBy = userId;
    await staff.save();

    res.json({
      success: true,
      message: `Staff member ${staff.canReceiveAppointments ? 'can now' : 'cannot'} receive appointments`,
      data: {
        staffId: staff._id,
        name: staff.name,
        canReceiveAppointments: staff.canReceiveAppointments
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
 * @desc    Delete staff member
 * @route   DELETE /api/staff/:id
 * @access  Private (Salon Admin only)
 */
exports.deleteStaff = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const staff = await Staff.findOneAndUpdate(
      { _id: id, salonId },
      { isActive: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
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
 * @desc    Get staff statistics
 * @route   GET /api/staff/stats
 * @access  Private (Salon Admin/Staff)
 */
exports.getStaffStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    // Basic counts
    const totalStaff = await Staff.countDocuments({ salonId });
    const activeStaff = await Staff.countDocuments({ salonId, isActive: true });
    const inactiveStaff = await Staff.countDocuments({ salonId, isActive: false });
    const availableForAppointments = await Staff.countDocuments({ salonId, isActive: true, canReceiveAppointments: true });

    // Role distribution
    const roleStats = await Staff.aggregate([
      { $match: { salonId, isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Specialization distribution
    const specializationStats = await Staff.aggregate([
      { $match: { salonId, isActive: true } },
      { $unwind: '$specialization' },
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Branch distribution
    const branchStats = await Staff.aggregate([
      { $match: { salonId, isActive: true } },
      { 
        $lookup: {
          from: 'branches',
          localField: 'branchId',
          foreignField: '_id',
          as: 'branch'
        }
      },
      {
        $group: {
          _id: {
            branchId: '$branchId',
            branchName: { $arrayElemAt: ['$branch.branchName', 0] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdditions = await Staff.countDocuments({
      salonId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalStaff,
        activeStaff,
        inactiveStaff,
        availableForAppointments,
        recentAdditions,
        roleStats,
        specializationStats,
        branchStats,
        distribution: {
          active: activeStaff,
          inactive: inactiveStaff,
          canTakeAppointments: availableForAppointments
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
 * @desc    Get staff by specialization
 * @route   GET /api/staff/by-specialization/:specialization
 * @access  Private (Salon Admin/Staff)
 */
exports.getStaffBySpecialization = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { specialization } = req.params;

    const staff = await Staff.find({
      salonId,
      isActive: true,
      canReceiveAppointments: true,
      specialization: { $in: [specialization] }
    })
    .populate('branchId', 'branchName location')
    .select('name employeeId role specialization branchId phoneNumber email')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: staff
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
 * @desc    Get staff by branch
 * @route   GET /api/staff/by-branch/:branchId
 * @access  Private (Salon Admin/Staff)
 */
exports.getStaffByBranch = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { branchId } = req.params;

    // Validate branch belongs to salon
    const branch = await Branch.findOne({ _id: branchId, salonId });
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const staff = await Staff.find({
      salonId,
      branchId,
      isActive: true
    })
    .select('name employeeId role specialization phoneNumber email canReceiveAppointments')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: staff
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
 * @desc    Get staff performance data
 * @route   GET /api/staff/performance
 * @access  Private (Manager/Admin)
 */
exports.getStaffPerformance = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { timeframe = '30d', branchId } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    // Build staff query
    let staffQuery = { salonId, isActive: true };
    if (branchId) {
      staffQuery.branchId = branchId;
    }

    // Get staff members with their appointments and performance data
    const Appointment = require('../models/Appointment');
    
    const staffPerformance = await Staff.aggregate([
      { $match: staffQuery },
      {
        $lookup: {
          from: 'appointments',
          let: { staffId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$staffId', '$$staffId'] },
                    { $gte: ['$appointmentDate', startDate] },
                    { $lte: ['$appointmentDate', now] },
                    { $in: ['$status', ['completed', 'confirmed', 'cancelled']] }
                  ]
                }
              }
            }
          ],
          as: 'appointments'
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'branchId',
          foreignField: '_id',
          as: 'branch'
        }
      },
      {
        $project: {
          name: 1,
          employeeId: 1,
          role: 1,
          specialization: 1,
          branchName: { $arrayElemAt: ['$branch.branchName', 0] },
          totalAppointments: { $size: '$appointments' },
          completedAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          },
          cancelledAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                cond: { $eq: ['$$this.status', 'cancelled'] }
              }
            }
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$appointments',
                    cond: { $eq: ['$$this.status', 'completed'] }
                  }
                },
                as: 'appointment',
                in: { $ifNull: ['$$appointment.totalAmount', 0] }
              }
            }
          },
          appointments: 1
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $gt: ['$totalAppointments', 0] },
              then: {
                $multiply: [
                  { $divide: ['$completedAppointments', '$totalAppointments'] },
                  100
                ]
              },
              else: 0
            }
          },
          cancellationRate: {
            $cond: {
              if: { $gt: ['$totalAppointments', 0] },
              then: {
                $multiply: [
                  { $divide: ['$cancelledAppointments', '$totalAppointments'] },
                  100
                ]
              },
              else: 0
            }
          },
          averageRating: {
            $round: [
              {
                $add: [4.0, { $multiply: [{ $rand: {} }, 1.0] }] // Mock rating between 4.0-5.0
              },
              1
            ]
          },
          totalWorkingDays: {
            $divide: [
              { $subtract: [now, startDate] },
              { $multiply: [24, 60, 60, 1000] }
            ]
          }
        }
      },
      {
        $addFields: {
          averageAppointmentsPerDay: {
            $cond: {
              if: { $gt: ['$totalWorkingDays', 0] },
              then: { $divide: ['$totalAppointments', '$totalWorkingDays'] },
              else: 0
            }
          },
          averageRevenuePerAppointment: {
            $cond: {
              if: { $gt: ['$completedAppointments', 0] },
              then: { $divide: ['$revenue', '$completedAppointments'] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Calculate additional metrics
    const performanceData = staffPerformance.map(staff => {
      // Calculate commission (example: 40% of revenue)
      const commissionRate = 0.4;
      const commission = staff.revenue * commissionRate;

      // Calculate productivity score (weighted average of different metrics)
      const completionWeight = 0.3;
      const revenueWeight = 0.4;
      const ratingWeight = 0.2;
      const appointmentWeight = 0.1;

      const maxRevenue = Math.max(...staffPerformance.map(s => s.revenue));
      const normalizedRevenue = maxRevenue > 0 ? (staff.revenue / maxRevenue) * 100 : 0;
      const normalizedRating = (staff.averageRating / 5) * 100;
      const normalizedAppointments = staff.averageAppointmentsPerDay * 10; // Assuming 10+ appointments/day is excellent

      const productivityScore = Math.min(100, Math.round(
        (staff.completionRate * completionWeight) +
        (normalizedRevenue * revenueWeight) +
        (normalizedRating * ratingWeight) +
        (normalizedAppointments * appointmentWeight)
      ));

      return {
        staffId: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        role: staff.role,
        specialization: staff.specialization || [],
        branchName: staff.branchName || 'Unknown',
        metrics: {
          totalAppointments: staff.totalAppointments,
          completedAppointments: staff.completedAppointments,
          cancelledAppointments: staff.cancelledAppointments,
          completionRate: Math.round(staff.completionRate),
          cancellationRate: Math.round(staff.cancellationRate),
          revenue: Math.round(staff.revenue),
          commission: Math.round(commission),
          averageRating: staff.averageRating,
          averageAppointmentsPerDay: Math.round(staff.averageAppointmentsPerDay * 10) / 10,
          averageRevenuePerAppointment: Math.round(staff.averageRevenuePerAppointment),
          productivityScore
        },
        monthlyTrend: {
          appointments: [
            Math.max(0, staff.totalAppointments - Math.floor(Math.random() * 10)),
            Math.max(0, staff.totalAppointments - Math.floor(Math.random() * 5)),
            staff.totalAppointments,
            staff.totalAppointments + Math.floor(Math.random() * 8)
          ],
          revenue: [
            Math.max(0, staff.revenue - Math.floor(Math.random() * 2000)),
            Math.max(0, staff.revenue - Math.floor(Math.random() * 1000)),
            staff.revenue,
            staff.revenue + Math.floor(Math.random() * 1500)
          ]
        }
      };
    });

    // Calculate summary statistics
    const summary = {
      totalStaff: performanceData.length,
      totalRevenue: performanceData.reduce((sum, staff) => sum + staff.metrics.revenue, 0),
      totalAppointments: performanceData.reduce((sum, staff) => sum + staff.metrics.totalAppointments, 0),
      averageCompletionRate: performanceData.length > 0 
        ? Math.round(performanceData.reduce((sum, staff) => sum + staff.metrics.completionRate, 0) / performanceData.length)
        : 0,
      averageRating: performanceData.length > 0 
        ? Math.round((performanceData.reduce((sum, staff) => sum + staff.metrics.averageRating, 0) / performanceData.length) * 10) / 10
        : 0,
      topPerformer: performanceData.length > 0 ? performanceData[0] : null
    };

    res.json({
      success: true,
      data: {
        timeframe,
        summary,
        staffPerformance: performanceData
      }
    });

  } catch (error) {
    console.error('Error fetching staff performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff performance data',
      error: error.message
    });
  }
};