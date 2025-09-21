const Staff = require('../models/Staff');
const Salon = require('../models/Salon');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all employees for a salon
 * @route   GET /api/employees
 * @access  Private (Salon Admin only)
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    let filter = { salonId: req.user.salonId };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }

    const employees = await Staff.find(filter)
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Staff.countDocuments(filter);

    res.json({
      success: true,
      data: employees,
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
 * @desc    Get employee by ID
 * @route   GET /api/employees/:id
 * @access  Private (Salon Admin only)
 */
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Staff.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    })
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Salon Admin only)
 */
exports.createEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const {
      name,
      email,
      phone,
      role,
      address,
      dateOfBirth,
      dateOfJoining,
      salary,
      commission,
      skills,
      experience,
      emergencyContact
    } = req.body;

    // Check if employee with email already exists in this salon
    const existingEmployee = await Staff.findOne({
      email,
      salonId: req.user.salonId
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Create new employee
    const employee = new Staff({
      name,
      email,
      phone,
      role,
      address,
      dateOfBirth,
      dateOfJoining,
      salary,
      commission,
      skills,
      experience,
      emergencyContact,
      salonId: req.user.salonId,
      createdBy: req.user.id,
      isActive: true
    });

    await employee.save();

    // Populate the created employee
    await employee.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
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
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Salon Admin only)
 */
exports.updateEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const {
      name,
      email,
      phone,
      role,
      address,
      dateOfBirth,
      dateOfJoining,
      salary,
      commission,
      skills,
      experience,
      emergencyContact
    } = req.body;

    let employee = await Staff.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if email is being changed and if it conflicts with another employee
    if (email !== employee.email) {
      const existingEmployee = await Staff.findOne({
        email,
        salonId: req.user.salonId,
        _id: { $ne: req.params.id }
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Another employee with this email already exists'
        });
      }
    }

    // Update employee fields
    employee.name = name;
    employee.email = email;
    employee.phone = phone;
    employee.role = role;
    employee.address = address;
    employee.dateOfBirth = dateOfBirth;
    employee.dateOfJoining = dateOfJoining;
    employee.salary = salary;
    employee.commission = commission;
    employee.skills = skills;
    employee.experience = experience;
    employee.emergencyContact = emergencyContact;
    employee.modifiedBy = req.user.id;
    employee.modifiedAt = new Date();

    await employee.save();

    // Populate the updated employee
    await employee.populate(['createdBy', 'modifiedBy'], 'name email');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Toggle employee active status
 * @route   PATCH /api/employees/:id/toggle-status
 * @access  Private (Salon Admin only)
 */
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const employee = await Staff.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Toggle active status
    employee.isActive = !employee.isActive;
    employee.modifiedBy = req.user.id;
    employee.modifiedAt = new Date();

    await employee.save();

    res.json({
      success: true,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Salon Admin only)
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Staff.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await Staff.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get employee statistics
 * @route   GET /api/employees/stats
 * @access  Private (Salon Admin only)
 */
exports.getEmployeeStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const totalEmployees = await Staff.countDocuments({ salonId });
    const activeEmployees = await Staff.countDocuments({ salonId, isActive: true });
    const inactiveEmployees = await Staff.countDocuments({ salonId, isActive: false });

    // Role-wise count
    const roleStats = await Staff.aggregate([
      { $match: { salonId: req.user.salonId } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Recent hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHires = await Staff.countDocuments({
      salonId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        recentHires,
        roleStats
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