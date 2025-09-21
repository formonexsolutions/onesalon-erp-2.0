const { validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

/**
 * @desc    Get all suppliers with filtering
 * @route   GET /api/suppliers
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status = 'active',
      sortBy = 'supplierName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get suppliers
    const suppliers = await Supplier.find(filter)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Supplier.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: suppliers,
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
 * @desc    Get single supplier with details
 * @route   GET /api/suppliers/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const supplier = await Supplier.findOne({ _id: id, salonId })
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get supplier statistics
    const stats = await supplier.getStatistics();

    res.json({
      success: true,
      data: {
        supplier,
        statistics: stats
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
 * @desc    Create new supplier
 * @route   POST /api/suppliers
 * @access  Private (Salon Admin)
 */
exports.createSupplier = async (req, res) => {
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

    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ 
      email: req.body.email, 
      salonId 
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    const supplierData = {
      ...req.body,
      salonId,
      createdBy: userId
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    const populatedSupplier = await Supplier.findById(supplier._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: populatedSupplier
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
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private (Salon Admin)
 */
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    const supplier = await Supplier.findOne({ _id: id, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if email is being changed and if it conflicts with another supplier
    if (req.body.email && req.body.email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ 
        email: req.body.email, 
        salonId,
        _id: { $ne: id }
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: 'Another supplier with this email already exists'
        });
      }
    }

    const updateData = { ...req.body };
    delete updateData.salonId; // Prevent salon change
    updateData.lastModifiedBy = userId;
    updateData.lastModifiedDate = new Date();

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: updatedSupplier
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
 * @desc    Delete supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Salon Admin)
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const supplier = await Supplier.findOne({ _id: id, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if supplier has active purchase orders
    const activePOs = await PurchaseOrder.countDocuments({
      supplierId: id,
      salonId,
      status: { $in: ['pending', 'approved', 'receiving'] }
    });

    if (activePOs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier with active purchase orders'
      });
    }

    // Soft delete - mark as inactive
    supplier.status = 'inactive';
    supplier.deletedDate = new Date();
    await supplier.save();

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
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
 * @desc    Get supplier's purchase orders
 * @route   GET /api/suppliers/:id/purchase-orders
 * @access  Private (Salon Admin/Staff)
 */
exports.getSupplierPurchaseOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;

    // Verify supplier exists
    const supplier = await Supplier.findOne({ _id: id, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Build filter
    const filter = { supplierId: id, salonId };
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.poDate = {};
      if (startDate) filter.poDate.$gte = new Date(startDate);
      if (endDate) filter.poDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get purchase orders
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('createdBy', 'name email')
      .sort({ poDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PurchaseOrder.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.supplierName,
          email: supplier.email
        },
        purchaseOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          hasNext: page < totalPages,
          hasPrev: page > 1
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
 * @desc    Get supplier's products
 * @route   GET /api/suppliers/:id/products
 * @access  Private (Salon Admin/Staff)
 */
exports.getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    // Verify supplier exists
    const supplier = await Supplier.findOne({ _id: id, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get products from this supplier
    const products = await Product.find({
      salonId,
      'suppliers.supplierId': id
    }).select('productName sku category currentStock suppliers');

    // Extract supplier-specific information for each product
    const supplierProducts = products.map(product => {
      const supplierInfo = product.suppliers.find(
        s => s.supplierId.toString() === id.toString()
      );
      
      return {
        productId: product._id,
        productName: product.productName,
        sku: product.sku,
        category: product.category,
        currentStock: product.currentStock,
        supplierInfo: supplierInfo || {}
      };
    });

    res.json({
      success: true,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.supplierName,
          email: supplier.email
        },
        products: supplierProducts,
        totalProducts: supplierProducts.length
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
 * @desc    Update supplier performance metrics
 * @route   PUT /api/suppliers/:id/performance
 * @access  Private (Salon Admin)
 */
exports.updateSupplierPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const {
      rating,
      reliabilityScore,
      qualityScore,
      notes
    } = req.body;

    const supplier = await Supplier.findOne({ _id: id, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Update performance metrics
    await supplier.updatePerformance(rating, reliabilityScore, qualityScore, notes);

    const updatedSupplier = await Supplier.findById(id)
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Supplier performance updated successfully',
      data: updatedSupplier
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
 * @desc    Get supplier analytics
 * @route   GET /api/suppliers/analytics
 * @access  Private (Salon Admin)
 */
exports.getSupplierAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Overall supplier statistics
    const supplierStats = await Supplier.aggregate([
      { $match: { salonId } },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          avgRating: { $avg: '$performanceMetrics.rating' },
          avgReliability: { $avg: '$performanceMetrics.reliabilityScore' },
          avgQuality: { $avg: '$performanceMetrics.qualityScore' }
        }
      }
    ]);

    // Top suppliers by purchase value
    const topSuppliers = await PurchaseOrder.aggregate([
      {
        $match: {
          salonId,
          poDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    // Supplier performance analysis
    const performanceAnalysis = await Supplier.aggregate([
      { $match: { salonId, status: 'active' } },
      {
        $group: {
          _id: null,
          topRated: {
            $push: {
              $cond: [
                { $gte: ['$performanceMetrics.rating', 4] },
                {
                  id: '$_id',
                  name: '$supplierName',
                  rating: '$performanceMetrics.rating'
                },
                null
              ]
            }
          },
          lowRated: {
            $push: {
              $cond: [
                { $lt: ['$performanceMetrics.rating', 3] },
                {
                  id: '$_id',
                  name: '$supplierName',
                  rating: '$performanceMetrics.rating'
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          topRated: {
            $filter: {
              input: '$topRated',
              cond: { $ne: ['$$this', null] }
            }
          },
          lowRated: {
            $filter: {
              input: '$lowRated',
              cond: { $ne: ['$$this', null] }
            }
          }
        }
      }
    ]);

    // Category-wise supplier distribution
    const categoryDistribution = await Supplier.aggregate([
      { $match: { salonId, status: 'active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$performanceMetrics.rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        supplierStats: supplierStats[0] || {},
        topSuppliers,
        performanceAnalysis: performanceAnalysis[0] || { topRated: [], lowRated: [] },
        categoryDistribution,
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
 * @desc    Generate supplier report
 * @route   GET /api/suppliers/report
 * @access  Private (Salon Admin)
 */
exports.generateSupplierReport = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { 
      reportType = 'summary',
      supplierId,
      category,
      status,
      startDate,
      endDate
    } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filter = { salonId };
    if (supplierId) filter._id = supplierId;
    if (category) filter.category = category;
    if (status) filter.status = status;

    let reportData;

    if (reportType === 'detailed') {
      // Detailed report with all supplier information
      reportData = await Supplier.find(filter)
        .populate('createdBy', 'name')
        .sort({ supplierName: 1 });
    } else if (reportType === 'performance') {
      // Performance-focused report
      reportData = await Supplier.aggregate([
        { $match: filter },
        {
          $project: {
            supplierName: 1,
            email: 1,
            phoneNumber: 1,
            category: 1,
            status: 1,
            performanceMetrics: 1,
            contractDetails: 1,
            analytics: 1
          }
        },
        { $sort: { 'performanceMetrics.rating': -1 } }
      ]);
    } else {
      // Summary report
      reportData = await Supplier.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSuppliers: { $sum: 1 },
            activeSuppliers: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            categoryBreakdown: {
              $push: '$category'
            },
            avgRating: { $avg: '$performanceMetrics.rating' },
            performanceDistribution: {
              $push: '$performanceMetrics.rating'
            }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        reportType,
        period: { startDate: start, endDate: end },
        filters: { supplierId, category, status },
        report: reportData
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
 * @desc    Bulk update supplier status
 * @route   PUT /api/suppliers/bulk-status
 * @access  Private (Salon Admin)
 */
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { supplierIds, status } = req.body;
    const salonId = req.user.salonId;

    if (!supplierIds || supplierIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier IDs are required'
      });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const result = await Supplier.updateMany(
      { 
        _id: { $in: supplierIds }, 
        salonId 
      },
      { 
        status,
        lastModifiedDate: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} suppliers updated successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        newStatus: status
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