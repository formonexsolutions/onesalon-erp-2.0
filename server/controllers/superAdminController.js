const Salon = require('../models/Salon');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/super-admin/dashboard
 * @access  Private (Super Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalSalons = await Salon.countDocuments();
    const pendingSalons = await Salon.countDocuments({ status: 'pending' });
    const approvedSalons = await Salon.countDocuments({ status: 'approved' });
    const rejectedSalons = await Salon.countDocuments({ status: 'rejected' });

    // Get recent salon requests (last 5)
    const recentRequests = await Salon.find()
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('name ownerName status submittedAt address.city address.state');

    res.json({
      success: true,
      data: {
        totalSalons,
        pendingSalons,
        approvedSalons,
        rejectedSalons,
        recentRequests
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
 * @desc    Get all salon requests with filtering
 * @route   GET /api/super-admin/salon-requests
 * @access  Private (Super Admin only)
 */
exports.getAllSalonRequests = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    const salons = await Salon.find(filter)
      .populate('reviewedBy', 'name')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Salon.countDocuments(filter);

    res.json({
      success: true,
      data: salons,
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
 * @desc    Get existing approved salons
 * @route   GET /api/super-admin/existing-salons
 * @access  Private (Super Admin only)
 */
exports.getExistingSalons = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let filter = { status: 'approved' };
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } }
      ];
    }

    const salons = await Salon.find(filter)
      .populate('reviewedBy', 'name')
      .sort({ reviewedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Salon.countDocuments(filter);

    res.json({
      success: true,
      data: salons,
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
 * @desc    Get salon details by ID
 * @route   GET /api/super-admin/salons/:id
 * @access  Private (Super Admin only)
 */
exports.getSalonDetails = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('reviewedBy', 'name email');

    if (!salon) {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }

    // Get employee count
    const employeeCount = await Staff.countDocuments({ salonId: salon._id });

    res.json({
      success: true,
      data: {
        ...salon.toObject(),
        employeeCount
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Approve salon
 * @route   POST /api/super-admin/approve-salon/:id
 * @access  Private (Super Admin only)
 */
exports.approveSalon = async (req, res) => {
  try {
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }

    if (salon.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pending salons can be approved' 
      });
    }

    // Update salon status
    salon.status = 'approved';
    salon.reviewedBy = req.user.id;
    salon.reviewedAt = new Date();
    salon.isActive = true;
    salon.rejectionReason = undefined; // Clear any previous rejection reason

    await salon.save();

    res.json({
      success: true,
      message: 'Salon approved successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Reject salon
 * @route   POST /api/super-admin/reject-salon/:id
 * @access  Private (Super Admin only)
 */
exports.rejectSalon = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    const { reason } = req.body;
    
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }

    if (salon.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'Only pending salons can be rejected' 
      });
    }

    // Update salon status
    salon.status = 'rejected';
    salon.rejectionReason = reason;
    salon.reviewedBy = req.user.id;
    salon.reviewedAt = new Date();
    salon.isActive = false;

    await salon.save();

    res.json({
      success: true,
      message: 'Salon rejected successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Toggle salon active/inactive status
 * @route   PATCH /api/super-admin/toggle-salon-status/:id
 * @access  Private (Super Admin only)
 */
exports.toggleSalonStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    const { isActive } = req.body;
    
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }

    if (salon.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        message: 'Only approved salons can have their status toggled' 
      });
    }

    // Update salon active status
    salon.isActive = isActive;
    salon.modifiedBy = req.user.id;
    salon.modifiedAt = new Date();

    await salon.save();

    // Update all staff active status based on salon status
    await Staff.updateMany(
      { salonId: salon._id },
      { isActive: isActive }
    );

    res.json({
      success: true,
      message: `Salon ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update salon status (approve/decline/hold)
 * @route   PUT /api/super-admin/salons/:id/status
 * @access  Private (Super Admin only)
 */
exports.updateSalonStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }

  try {
    const { status, declineReason } = req.body;
    
    const salon = await Salon.findById(req.params.id);
    if (!salon) {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }

    // Update salon status
    salon.status = status;
    salon.modifiedBy = req.user.id;
    salon.modifiedAt = new Date();

    if (status === 'approved') {
      salon.reviewedBy = req.user.id;
      salon.reviewedAt = new Date();
      salon.isActive = true;
      salon.rejectionReason = undefined; // Clear any previous decline reason
    } else if (status === 'declined') {
      salon.rejectionReason = declineReason;
      salon.reviewedBy = req.user.id;
      salon.reviewedAt = new Date();
      salon.isActive = false;
    }

    await salon.save();

    // If salon is approved, activate all its staff
    if (status === 'approved') {
      await Staff.updateMany(
        { salonId: salon._id },
        { isActive: true }
      );
    } else {
      // If salon is declined or on hold, deactivate all its staff
      await Staff.updateMany(
        { salonId: salon._id },
        { isActive: false }
      );
    }

    res.json({
      success: true,
      message: `Salon ${status} successfully`
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Salon not found' 
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};