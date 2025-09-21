const Service = require('../models/Service');
const Staff = require('../models/Staff');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all services for a salon with pagination and search
 * @route   GET /api/services
 * @access  Private (Salon Staff)
 */
exports.getAllServices = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    let filter = { salonId: req.user.salonId };
    
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const services = await Service.find(filter)
      .populate('createdBy', 'name')
      .populate('modifiedBy', 'name')
      .sort(sortObject)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    res.json({
      success: true,
      data: services,
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
 * @desc    Get service by ID
 * @route   GET /api/services/:id
 * @access  Private (Salon Staff)
 */
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    })
    .populate('createdBy', 'name email')
    .populate('modifiedBy', 'name email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Salon Staff)
 */
exports.createService = async (req, res) => {
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
      serviceName,
      category,
      price,
      duration,
      description,
      isActive
    } = req.body;

    // Check if service with same name already exists in this salon
    const existingService = await Service.findOne({
      serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
      salonId: req.user.salonId
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    // Create new service
    const service = new Service({
      serviceName,
      category,
      price,
      duration,
      description,
      isActive: isActive !== undefined ? isActive : true,
      salonId: req.user.salonId,
      createdBy: req.user.id
    });

    await service.save();

    // Populate the created service
    await service.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
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
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Salon Staff)
 */
exports.updateService = async (req, res) => {
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
      serviceName,
      category,
      price,
      duration,
      description,
      isActive
    } = req.body;

    let service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if service name is being changed and if it conflicts with another service
    if (serviceName.toLowerCase() !== service.serviceName.toLowerCase()) {
      const existingService = await Service.findOne({
        serviceName: { $regex: new RegExp(`^${serviceName}$`, 'i') },
        salonId: req.user.salonId,
        _id: { $ne: req.params.id }
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Another service with this name already exists'
        });
      }
    }

    // Update service fields
    service.serviceName = serviceName;
    service.category = category;
    service.price = price;
    service.duration = duration;
    service.description = description;
    service.isActive = isActive !== undefined ? isActive : service.isActive;
    service.modifiedBy = req.user.id;

    await service.save();

    // Populate the updated service
    await service.populate(['createdBy', 'modifiedBy'], 'name email');

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Toggle service status (active/inactive)
 * @route   PATCH /api/services/:id/toggle-status
 * @access  Private (Salon Staff)
 */
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    service.isActive = !service.isActive;
    service.modifiedBy = req.user.id;

    await service.save();

    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      data: service
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private (Salon Staff)
 */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get service statistics
 * @route   GET /api/services/stats
 * @access  Private (Salon Staff)
 */
exports.getServiceStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const totalServices = await Service.countDocuments({ salonId });
    const activeServices = await Service.countDocuments({ salonId, isActive: true });
    const inactiveServices = await Service.countDocuments({ salonId, isActive: false });

    // Get service categories
    const categoryStats = await Service.aggregate([
      { $match: { salonId: req.user.salonId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average service price
    const priceStats = await Service.aggregate([
      { $match: { salonId: req.user.salonId, isActive: true } },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalServices,
        activeServices,
        inactiveServices,
        categoryStats,
        priceStats: priceStats[0] || { averagePrice: 0, minPrice: 0, maxPrice: 0 }
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
 * @desc    Get service categories
 * @route   GET /api/services/categories
 * @access  Private (Salon Staff)
 */
exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category', { salonId: req.user.salonId });
    
    res.json({
      success: true,
      data: categories
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
 * @desc    Get service pricing for date
 * @route   GET /api/services/:id/pricing
 * @access  Private (Salon Staff)
 */
exports.getServicePricing = async (req, res) => {
  try {
    const { date = new Date() } = req.query;
    
    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId,
      isActive: true
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const pricing = service.getCurrentPricing ? service.getCurrentPricing(new Date(date)) : { price: service.price };

    res.json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.serviceName,
        basePrice: service.price,
        currentPricing: pricing,
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
 * @desc    Check service availability
 * @route   GET /api/services/:id/availability
 * @access  Private (Salon Staff)
 */
exports.checkServiceAvailability = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId,
      isActive: true
    }).populate('restrictedToStaff', 'name');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const requestedDate = new Date(date);
    const availability = service.checkAvailability ? 
      service.checkAvailability(requestedDate, time) : 
      { available: true, reason: 'Service available' };

    res.json({
      success: true,
      data: {
        serviceId: service._id,
        serviceName: service.serviceName,
        available: availability.available,
        reason: availability.reason,
        availableStaff: service.restrictedToStaff && service.restrictedToStaff.length > 0 ? 
          service.restrictedToStaff : 'All staff',
        date: requestedDate,
        time: time
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
 * @desc    Get services by category
 * @route   GET /api/services/category/:category
 * @access  Private (Salon Staff)
 */
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { isActive = true } = req.query;

    const services = await Service.find({
      salonId: req.user.salonId,
      category: category,
      isActive: isActive === 'true'
    })
    .populate('restrictedToStaff', 'name email')
    .sort({ serviceName: 1 });

    res.json({
      success: true,
      data: services,
      category: category,
      count: services.length
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
 * @desc    Update service add-ons
 * @route   PUT /api/services/:id/addons
 * @access  Private (Salon Admin)
 */
exports.updateServiceAddOns = async (req, res) => {
  try {
    const { addOns } = req.body;

    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (service.addOns) {
      service.addOns = addOns;
    } else {
      // For basic service model compatibility
      service.addOns = addOns;
    }
    
    await service.save();

    res.json({
      success: true,
      message: 'Service add-ons updated successfully',
      data: service
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
 * @desc    Update service booking rules
 * @route   PUT /api/services/:id/booking-rules
 * @access  Private (Salon Admin)
 */
exports.updateBookingRules = async (req, res) => {
  try {
    const { bookingRules } = req.body;

    const service = await Service.findOne({
      _id: req.params.id,
      salonId: req.user.salonId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (service.bookingRules) {
      service.bookingRules = { ...service.bookingRules, ...bookingRules };
    } else {
      // For basic service model compatibility
      service.bookingRules = bookingRules;
    }
    
    await service.save();

    res.json({
      success: true,
      message: 'Service booking rules updated successfully',
      data: service
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};