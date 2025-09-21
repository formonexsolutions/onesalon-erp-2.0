const Customer = require('../models/Customer');
const CustomerVisit = require('../models/CustomerVisit');
const CustomerFeedback = require('../models/CustomerFeedback');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all customers for a salon with pagination and search
 * @route   GET /api/customers
 * @access  Private (Salon Staff)
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const { 
      search, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      loyaltyTier,
      isActive,
      customerType
    } = req.query;
    
    // Build filter object
    let filter = { salonId: req.user.salonId };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (loyaltyTier) filter.loyaltyTier = loyaltyTier;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (customerType) filter.customerType = customerType;

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(filter)
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .populate('referredBy', 'name phoneNumber')
      .sort(sortObject)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      data: customers,
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
 * @desc    Get customer by ID with visit history
 * @route   GET /api/customers/:id
 * @access  Private (Salon Staff)
 */
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    })
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email')
    .populate('referredBy', 'name phoneNumber')
    .populate('preferredStylists', 'name');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get recent visit history
    const recentVisits = await CustomerVisit.find({
      customer: req.params.id,
      salon: req.user.salonId
    })
    .populate('services.staff', 'name')
    .sort({ visitDate: -1 })
    .limit(10);

    // Get customer feedback
    const feedback = await CustomerFeedback.find({
      customer: req.params.id,
      salon: req.user.salonId
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        customer,
        recentVisits,
        feedback
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private (Salon Staff)
 */
exports.createCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const customerData = {
      ...req.body,
      salonId: req.user.salonId,
      createdBy: req.user.id
    };

    // Check if customer with phone already exists in this salon
    const existingCustomer = await Customer.findOne({
      phoneNumber: customerData.phoneNumber,
      salonId: req.user.salonId
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }

    // Generate referral code if not provided
    if (!customerData.referralCode) {
      customerData.referralCode = `${customerData.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;
    }

    // Create new customer
    const customer = new Customer(customerData);
    await customer.save();

    // Update referrer's referral count if applicable
    if (customerData.referredBy) {
      await Customer.findByIdAndUpdate(
        customerData.referredBy,
        { $inc: { referralCount: 1, loyaltyPoints: 100 } } // 100 points for referral
      );
    }

    // Populate the created customer
    await customer.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'referredBy', select: 'name phoneNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
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
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Salon Staff)
 */
exports.updateCustomer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    let customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if phone is being changed and if it conflicts with another customer
    if (req.body.phoneNumber && req.body.phoneNumber !== customer.phoneNumber) {
      const existingCustomer = await Customer.findOne({
        phoneNumber: req.body.phoneNumber,
        salonId: req.user.salonId,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Another customer with this phone number already exists'
        });
      }
    }

    // Update customer fields
    Object.assign(customer, req.body);
    customer.modifiedBy = req.user.id;

    await customer.save();

    // Populate the updated customer
    await customer.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'modifiedBy', select: 'name email' },
      { path: 'referredBy', select: 'name phoneNumber' }
    ]);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete customer (soft delete)
 * @route   DELETE /api/customers/:id
 * @access  Private (Salon Staff)
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Soft delete - mark as inactive
    customer.isActive = false;
    customer.modifiedBy = req.user.id;
    await customer.save();

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get customer analytics dashboard
 * @route   GET /api/customers/analytics
 * @access  Private (Salon Staff)
 */
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Basic customer metrics
    const totalCustomers = await Customer.countDocuments({ salonId, isActive: true });
    const newCustomers = await Customer.countDocuments({
      salonId,
      isActive: true,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Loyalty tier distribution
    const loyaltyDistribution = await Customer.aggregate([
      { $match: { salonId: salonId, isActive: true } },
      { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } }
    ]);

    // Customer type distribution
    const customerTypeDistribution = await Customer.aggregate([
      { $match: { salonId: salonId, isActive: true } },
      { $group: { _id: '$customerType', count: { $sum: 1 } } }
    ]);

    // Customers with birthdays this month
    const birthdayCustomers = await Customer.find({
      salonId,
      isActive: true,
      $expr: { $eq: [{ $month: '$dateOfBirth' }, currentMonth + 1] }
    }).select('name phoneNumber dateOfBirth');

    // Top customers by total spent
    const topCustomers = await Customer.find({ salonId, isActive: true })
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name phoneNumber totalSpent totalVisits loyaltyTier');

    // Recent visit analytics
    const recentVisitStats = await CustomerVisit.aggregate([
      { 
        $match: { 
          salon: salonId, 
          visitDate: { $gte: thirtyDaysAgo },
          status: 'completed'
        } 
      },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          averageSpent: { $avg: '$totalAmount' },
          averageRating: { $avg: '$customerRating' }
        }
      }
    ]);

    // Customer retention rate (customers who visited in last 30 days vs previous 30 days)
    const previousPeriod = new Date();
    previousPeriod.setDate(previousPeriod.getDate() - 60);
    
    const currentPeriodCustomers = await CustomerVisit.distinct('customer', {
      salon: salonId,
      visitDate: { $gte: thirtyDaysAgo },
      status: 'completed'
    });
    
    const previousPeriodCustomers = await CustomerVisit.distinct('customer', {
      salon: salonId,
      visitDate: { $gte: previousPeriod, $lt: thirtyDaysAgo },
      status: 'completed'
    });

    const retentionRate = previousPeriodCustomers.length > 0 
      ? (currentPeriodCustomers.filter(c => previousPeriodCustomers.includes(c)).length / previousPeriodCustomers.length) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          newCustomers,
          retentionRate: Math.round(retentionRate * 100) / 100
        },
        distributions: {
          loyaltyTiers: loyaltyDistribution,
          customerTypes: customerTypeDistribution
        },
        birthdayCustomers,
        topCustomers,
        recentActivity: recentVisitStats[0] || {
          totalVisits: 0,
          totalRevenue: 0,
          averageSpent: 0,
          averageRating: 0
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
 * @desc    Update customer loyalty points
 * @route   PUT /api/customers/:id/loyalty
 * @access  Private (Salon Staff)
 */
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const { points, operation = 'add', reason } = req.body;
    
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const pointsChange = operation === 'add' ? points : -points;
    customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints + pointsChange);
    
    // Auto-upgrade loyalty tier based on points
    if (customer.loyaltyPoints >= 5000) customer.loyaltyTier = 'vip';
    else if (customer.loyaltyPoints >= 2000) customer.loyaltyTier = 'platinum';
    else if (customer.loyaltyPoints >= 1000) customer.loyaltyTier = 'gold';
    else if (customer.loyaltyPoints >= 500) customer.loyaltyTier = 'silver';
    else customer.loyaltyTier = 'bronze';

    customer.modifiedBy = req.user.id;
    await customer.save();

    res.json({
      success: true,
      message: `Loyalty points ${operation === 'add' ? 'added' : 'deducted'} successfully`,
      data: {
        customerId: customer._id,
        loyaltyPoints: customer.loyaltyPoints,
        loyaltyTier: customer.loyaltyTier,
        pointsChanged: pointsChange,
        reason
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
 * @desc    Create customer visit record
 * @route   POST /api/customers/:id/visits
 * @access  Private (Salon Staff)
 */
exports.createCustomerVisit = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const visitData = {
      ...req.body,
      customer: req.params.id,
      salon: req.user.salonId,
      createdBy: req.user.id
    };

    const visit = new CustomerVisit(visitData);
    await visit.save();

    // Update customer statistics
    if (visit.status === 'completed') {
      customer.totalVisits += 1;
      customer.totalSpent += visit.totalAmount;
      customer.averageSpent = customer.totalSpent / customer.totalVisits;
      customer.lastVisit = visit.visitDate;
      customer.customerLifetimeValue = customer.totalSpent;
      
      // Award loyalty points (1 point per rupee spent)
      customer.loyaltyPoints += Math.floor(visit.totalAmount);
      
      await customer.save();
    }

    await visit.populate([
      { path: 'customer', select: 'name phoneNumber' },
      { path: 'services.staff', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer visit recorded successfully',
      data: visit
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
 * @desc    Create customer feedback
 * @route   POST /api/customers/:id/feedback
 * @access  Private (Salon Staff)
 */
exports.createCustomerFeedback = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const feedbackData = {
      ...req.body,
      customer: req.params.id,
      salon: req.user.salonId,
      createdBy: req.user.id
    };

    const feedback = new CustomerFeedback(feedbackData);
    await feedback.save();

    await feedback.populate([
      { path: 'customer', select: 'name phoneNumber' },
      { path: 'visit', select: 'visitDate totalAmount' },
      { path: 'serviceFeedback.staff', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer feedback recorded successfully',
      data: feedback
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
 * @desc    Get customer visit history
 * @route   GET /api/customers/:id/visits
 * @access  Private (Salon Staff)
 */
exports.getCustomerVisits = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const customer = await Customer.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const visits = await CustomerVisit.find({
      customer: req.params.id,
      salon: req.user.salonId
    })
    .populate('services.staff', 'name')
    .sort({ visitDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await CustomerVisit.countDocuments({
      customer: req.params.id,
      salon: req.user.salonId
    });

    res.json({
      success: true,
      data: visits,
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
 * @desc    Get customers with upcoming birthdays/anniversaries
 * @route   GET /api/customers/celebrations
 * @access  Private (Salon Staff)
 */
exports.getUpcomingCelebrations = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const futureMonth = futureDate.getMonth() + 1;
    const futureDay = futureDate.getDate();

    let matchCondition;
    
    if (currentMonth === futureMonth) {
      // Same month
      matchCondition = {
        $and: [
          { $gte: [{ $dayOfMonth: '$dateOfBirth' }, currentDay] },
          { $lte: [{ $dayOfMonth: '$dateOfBirth' }, futureDay] },
          { $eq: [{ $month: '$dateOfBirth' }, currentMonth] }
        ]
      };
    } else {
      // Across months
      matchCondition = {
        $or: [
          {
            $and: [
              { $gte: [{ $dayOfMonth: '$dateOfBirth' }, currentDay] },
              { $eq: [{ $month: '$dateOfBirth' }, currentMonth] }
            ]
          },
          {
            $and: [
              { $lte: [{ $dayOfMonth: '$dateOfBirth' }, futureDay] },
              { $eq: [{ $month: '$dateOfBirth' }, futureMonth] }
            ]
          }
        ]
      };
    }

    const upcomingBirthdays = await Customer.find({
      salonId: req.user.salonId,
      isActive: true,
      dateOfBirth: { $exists: true },
      $expr: matchCondition
    }).select('name phoneNumber email dateOfBirth loyaltyTier communicationPreferences');

    // Similar logic for anniversaries
    const upcomingAnniversaries = await Customer.find({
      salonId: req.user.salonId,
      isActive: true,
      anniversary: { $exists: true },
      $expr: matchCondition.toString().replace(/dateOfBirth/g, 'anniversary')
    }).select('name phoneNumber email anniversary loyaltyTier communicationPreferences');

    res.json({
      success: true,
      data: {
        birthdays: upcomingBirthdays,
        anniversaries: upcomingAnniversaries
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