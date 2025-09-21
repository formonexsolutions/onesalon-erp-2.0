const { validationResult } = require('express-validator');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');

/**
 * @desc    Get all stock movements with filtering
 * @route   GET /api/stock-movements
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllStockMovements = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      productId,
      movementType,
      startDate,
      endDate,
      approvalStatus,
      sortBy = 'movementDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (productId) filter.productId = productId;
    if (movementType) filter.movementType = movementType;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    
    if (startDate || endDate) {
      filter.movementDate = {};
      if (startDate) filter.movementDate.$gte = new Date(startDate);
      if (endDate) filter.movementDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get movements
    const movements = await StockMovement.find(filter)
      .populate('productId', 'productName sku barcode')
      .populate('performedBy', 'name email')
      .populate('supplierId', 'supplierName')
      .populate('customerId', 'firstName lastName')
      .populate('approvedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await StockMovement.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: movements,
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
 * @desc    Get single stock movement
 * @route   GET /api/stock-movements/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const movement = await StockMovement.findOne({ _id: id, salonId })
      .populate('productId', 'productName sku barcode currentStock')
      .populate('performedBy', 'name email')
      .populate('supplierId', 'supplierName contactPersonName')
      .populate('customerId', 'firstName lastName email')
      .populate('approvedBy', 'name email')
      .populate('reversedBy', 'name email');

    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    res.json({
      success: true,
      data: movement
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
 * @desc    Create manual stock movement
 * @route   POST /api/stock-movements
 * @access  Private (Salon Admin)
 */
exports.createStockMovement = async (req, res) => {
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
      productId,
      movementType,
      quantity,
      reason,
      notes,
      unitCost,
      referenceType,
      referenceId,
      referenceNumber,
      supplierId,
      customerId,
      expiryDate,
      batchNumber,
      location
    } = req.body;

    // Validate product
    const product = await Product.findOne({ _id: productId, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability for consumption/sales movements
    const consumptionTypes = ['consumption', 'sales', 'waste', 'adjustment_negative'];
    if (consumptionTypes.includes(movementType) && product.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    const stockBefore = product.currentStock;

    // Update product stock based on movement type
    if (movementType === 'adjustment_positive' || movementType === 'purchase_receipt') {
      await product.addStock(quantity, reason, notes, expiryDate);
    } else if (consumptionTypes.includes(movementType)) {
      await product.consumeStock(quantity, reason);
    }

    // Create stock movement record
    const stockMovement = new StockMovement({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      movementType,
      quantity,
      unit: product.unit,
      stockBefore,
      stockAfter: product.currentStock,
      unitCost: unitCost || product.costPrice,
      totalValue: quantity * (unitCost || product.costPrice),
      referenceType,
      referenceId,
      referenceNumber,
      supplierId,
      customerId,
      reason,
      notes,
      expiryDate,
      batchNumber,
      location,
      salonId,
      performedBy: userId,
      performedByName: req.user.name,
      approvalRequired: quantity > 50 || movementType === 'adjustment_negative',
      createdBy: userId
    });

    await stockMovement.save();

    const populatedMovement = await StockMovement.findById(stockMovement._id)
      .populate('productId', 'productName sku')
      .populate('performedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Stock movement created successfully',
      data: populatedMovement
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
 * @desc    Approve stock movement
 * @route   PUT /api/stock-movements/:id/approve
 * @access  Private (Salon Admin)
 */
exports.approveStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    const movement = await StockMovement.findOne({ _id: id, salonId });
    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    if (movement.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Stock movement is already approved'
      });
    }

    // Approve the movement
    await movement.approve(userId, notes);

    const updatedMovement = await StockMovement.findById(id)
      .populate('productId', 'productName sku')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Stock movement approved successfully',
      data: updatedMovement
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
 * @desc    Reject stock movement
 * @route   PUT /api/stock-movements/:id/reject
 * @access  Private (Salon Admin)
 */
exports.rejectStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const movement = await StockMovement.findOne({ _id: id, salonId });
    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    // Reject the movement
    await movement.reject(userId, rejectionReason);

    // If movement was already applied to stock, reverse it
    if (movement.isApplied) {
      const product = await Product.findById(movement.productId);
      if (product) {
        if (movement.movementType === 'adjustment_positive' || movement.movementType === 'purchase_receipt') {
          await product.consumeStock(movement.quantity, 'Reversed due to rejection');
        } else {
          await product.addStock(movement.quantity, 'Reversed due to rejection');
        }
      }
    }

    const updatedMovement = await StockMovement.findById(id)
      .populate('productId', 'productName sku')
      .populate('rejectedBy', 'name email');

    res.json({
      success: true,
      message: 'Stock movement rejected successfully',
      data: updatedMovement
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
 * @desc    Reverse stock movement
 * @route   PUT /api/stock-movements/:id/reverse
 * @access  Private (Salon Admin)
 */
exports.reverseStockMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { reversalReason } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    if (!reversalReason) {
      return res.status(400).json({
        success: false,
        message: 'Reversal reason is required'
      });
    }

    const movement = await StockMovement.findOne({ _id: id, salonId });
    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Stock movement not found'
      });
    }

    if (movement.isReversed) {
      return res.status(400).json({
        success: false,
        message: 'Stock movement is already reversed'
      });
    }

    // Reverse the movement
    await movement.reverse(userId, reversalReason);

    // Create reversal stock movement and update product stock
    const product = await Product.findById(movement.productId);
    if (product) {
      const stockBefore = product.currentStock;
      
      // Apply reverse operation
      if (movement.movementType === 'adjustment_positive' || movement.movementType === 'purchase_receipt') {
        await product.consumeStock(movement.quantity, `Reversal: ${reversalReason}`);
      } else {
        await product.addStock(movement.quantity, `Reversal: ${reversalReason}`);
      }

      // Create reversal movement record
      const reversalMovement = new StockMovement({
        productId: product._id,
        productName: product.productName,
        sku: product.sku,
        barcode: product.barcode,
        movementType: `${movement.movementType}_reversal`,
        quantity: movement.quantity,
        unit: product.unit,
        stockBefore,
        stockAfter: product.currentStock,
        unitCost: movement.unitCost,
        totalValue: movement.totalValue,
        referenceType: 'stock_movement_reversal',
        referenceId: movement._id,
        referenceNumber: movement.movementNumber,
        reason: reversalReason,
        notes: `Reversal of movement ${movement.movementNumber}`,
        salonId,
        performedBy: userId,
        performedByName: req.user.name,
        isReversal: true,
        originalMovementId: movement._id,
        createdBy: userId
      });

      await reversalMovement.save();
    }

    const updatedMovement = await StockMovement.findById(id)
      .populate('productId', 'productName sku')
      .populate('reversedBy', 'name email');

    res.json({
      success: true,
      message: 'Stock movement reversed successfully',
      data: updatedMovement
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
 * @desc    Get stock movement analytics
 * @route   GET /api/stock-movements/analytics
 * @access  Private (Salon Admin)
 */
exports.getStockMovementAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { startDate, endDate, productId } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const matchStage = {
      salonId,
      movementDate: { $gte: start, $lte: end }
    };

    if (productId) {
      matchStage.productId = productId;
    }

    // Movement type breakdown
    const movementTypeBreakdown = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$movementType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Daily movement trend
    const dailyTrend = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$movementDate' },
            month: { $month: '$movementDate' },
            day: { $dayOfMonth: '$movementDate' }
          },
          totalMovements: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          incomingQuantity: {
            $sum: {
              $cond: [
                { $in: ['$movementType', ['purchase_receipt', 'adjustment_positive', 'return']] },
                '$quantity',
                0
              ]
            }
          },
          outgoingQuantity: {
            $sum: {
              $cond: [
                { $in: ['$movementType', ['consumption', 'sales', 'waste', 'adjustment_negative']] },
                '$quantity',
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Top moving products
    const topMovingProducts = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          sku: { $first: '$sku' },
          totalMovements: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    // Supplier-wise movements
    const supplierMovements = await StockMovement.aggregate([
      { 
        $match: { 
          ...matchStage,
          supplierId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          totalMovements: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    // Overall statistics
    const overallStats = await StockMovement.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalMovements: { $sum: 1 },
          totalValue: { $sum: '$totalValue' },
          avgMovementValue: { $avg: '$totalValue' },
          pendingApprovals: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] }
          },
          rejectedMovements: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] }
          },
          reversedMovements: {
            $sum: { $cond: ['$isReversed', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overallStats: overallStats[0] || {},
        movementTypeBreakdown,
        dailyTrend,
        topMovingProducts,
        supplierMovements,
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
 * @desc    Get product stock history
 * @route   GET /api/stock-movements/product/:productId/history
 * @access  Private (Salon Admin/Staff)
 */
exports.getProductStockHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;
    const salonId = req.user.salonId;

    // Verify product exists
    const product = await Product.findOne({ _id: productId, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Get stock movements for the product
    const movements = await StockMovement.find({
      productId,
      salonId,
      movementDate: { $gte: startDate }
    })
    .populate('performedBy', 'name')
    .populate('supplierId', 'supplierName')
    .sort({ movementDate: 1 });

    // Calculate stock levels over time
    const stockHistory = [];
    let runningStock = movements.length > 0 ? movements[0].stockBefore : product.currentStock;

    for (const movement of movements) {
      stockHistory.push({
        date: movement.movementDate,
        movementType: movement.movementType,
        quantity: movement.quantity,
        stockBefore: movement.stockBefore,
        stockAfter: movement.stockAfter,
        reason: movement.reason,
        notes: movement.notes,
        performedBy: movement.performedBy?.name,
        supplier: movement.supplierId?.supplierName
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.productName,
          sku: product.sku,
          currentStock: product.currentStock,
          stockStatus: product.stockStatus
        },
        stockHistory,
        period: `${days} days`
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
 * @desc    Bulk approve stock movements
 * @route   PUT /api/stock-movements/bulk-approve
 * @access  Private (Salon Admin)
 */
exports.bulkApproveMovements = async (req, res) => {
  try {
    const { movementIds, approvalNotes } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    if (!movementIds || movementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movement IDs are required'
      });
    }

    const results = {
      approved: [],
      failed: []
    };

    for (const movementId of movementIds) {
      try {
        const movement = await StockMovement.findOne({ _id: movementId, salonId });
        if (movement && movement.approvalStatus === 'pending') {
          await movement.approve(userId, approvalNotes);
          results.approved.push(movementId);
        } else {
          results.failed.push({
            id: movementId,
            reason: 'Movement not found or already processed'
          });
        }
      } catch (error) {
        results.failed.push({
          id: movementId,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk approval completed. ${results.approved.length} approved, ${results.failed.length} failed.`,
      data: results
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
 * @desc    Generate stock movement report
 * @route   GET /api/stock-movements/report
 * @access  Private (Salon Admin)
 */
exports.generateStockMovementReport = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { 
      startDate, 
      endDate, 
      productId, 
      movementType, 
      reportType = 'summary' 
    } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filter = {
      salonId,
      movementDate: { $gte: start, $lte: end }
    };

    if (productId) filter.productId = productId;
    if (movementType) filter.movementType = movementType;

    let reportData;

    if (reportType === 'detailed') {
      // Detailed report with all movements
      reportData = await StockMovement.find(filter)
        .populate('productId', 'productName sku')
        .populate('performedBy', 'name')
        .populate('supplierId', 'supplierName')
        .sort({ movementDate: -1 });
    } else {
      // Summary report
      reportData = await StockMovement.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalMovements: { $sum: 1 },
            totalValue: { $sum: '$totalValue' },
            avgMovementValue: { $avg: '$totalValue' },
            totalQuantity: { $sum: '$quantity' },
            movementTypes: {
              $push: '$movementType'
            },
            valueByType: {
              $push: {
                type: '$movementType',
                value: '$totalValue',
                quantity: '$quantity'
              }
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
        filters: { productId, movementType },
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