const { validationResult } = require('express-validator');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');

/**
 * @desc    Get all purchase orders with filtering
 * @route   GET /api/purchase-orders
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      status,
      supplierId,
      approvalStatus,
      startDate,
      endDate,
      sortBy = 'poDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    
    if (startDate || endDate) {
      filter.poDate = {};
      if (startDate) filter.poDate.$gte = new Date(startDate);
      if (endDate) filter.poDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get purchase orders
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'supplierName contactPersonName email phoneNumber')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await PurchaseOrder.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: purchaseOrders,
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
 * @desc    Get single purchase order
 * @route   GET /api/purchase-orders/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId })
      .populate('supplierId', 'supplierName contactPersonName email phoneNumber address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('receivedBy', 'name email');

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
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
 * @desc    Create new purchase order
 * @route   POST /api/purchase-orders
 * @access  Private (Salon Admin)
 */
exports.createPurchaseOrder = async (req, res) => {
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
      supplierId,
      items,
      expectedDeliveryDate,
      paymentTerms,
      deliveryTerms,
      notes,
      urgencyLevel = 'normal'
    } = req.body;

    // Validate supplier
    const supplier = await Supplier.findOne({ _id: supplierId, salonId });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, salonId });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const itemUnitPrice = item.unitPrice || product.costPrice || 0;
      const processedItem = {
        productId: product._id,
        productName: product.productName,
        sku: product.sku,
        barcode: product.barcode,
        orderedQuantity: item.quantity,
        unitPrice: itemUnitPrice,
        totalPrice: item.quantity * itemUnitPrice,
        unit: product.unit,
        notes: item.notes || ''
      };

      processedItems.push(processedItem);
      subtotal += processedItem.totalPrice;
    }

    // Calculate totals
    const taxRate = req.body.taxRate || 0;
    const discountAmount = req.body.discountAmount || 0;
    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      supplierId,
      supplierName: supplier.supplierName,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phoneNumber,
      items: processedItems,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      expectedDeliveryDate,
      paymentTerms: paymentTerms || supplier.paymentTerms,
      deliveryTerms: deliveryTerms || supplier.deliveryTerms,
      urgencyLevel,
      notes,
      salonId,
      createdBy: userId
    });

    await purchaseOrder.save();

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplierId', 'supplierName contactPersonName email phoneNumber')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: populatedPO
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
 * @desc    Update purchase order
 * @route   PUT /api/purchase-orders/:id
 * @access  Private (Salon Admin)
 */
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if PO can be updated
    if (purchaseOrder.status === 'completed' || purchaseOrder.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled purchase orders'
      });
    }

    const updateData = { ...req.body };
    delete updateData.salonId; // Prevent salon change
    
    // Add revision tracking
    const currentRevision = purchaseOrder.revisionNumber || 0;
    updateData.revisionNumber = currentRevision + 1;
    updateData.lastModifiedBy = userId;
    updateData.lastModifiedDate = new Date();

    // If status is being changed to cancelled, update item statuses
    if (updateData.status === 'cancelled') {
      updateData.items = purchaseOrder.items.map(item => ({
        ...item.toObject(),
        status: 'cancelled'
      }));
    }

    const updatedPO = await PurchaseOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplierId', 'supplierName contactPersonName email phoneNumber')
     .populate('createdBy', 'name email')
     .populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: updatedPO
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
 * @desc    Approve purchase order
 * @route   PUT /api/purchase-orders/:id/approve
 * @access  Private (Salon Admin)
 */
exports.approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order is already approved'
      });
    }

    // Approve the purchase order
    await purchaseOrder.approve(userId, notes);

    const updatedPO = await PurchaseOrder.findById(id)
      .populate('supplierId', 'supplierName contactPersonName')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      message: 'Purchase order approved successfully',
      data: updatedPO
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
 * @desc    Reject purchase order
 * @route   PUT /api/purchase-orders/:id/reject
 * @access  Private (Salon Admin)
 */
exports.rejectPurchaseOrder = async (req, res) => {
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

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Reject the purchase order
    await purchaseOrder.reject(userId, rejectionReason);

    const updatedPO = await PurchaseOrder.findById(id)
      .populate('supplierId', 'supplierName contactPersonName')
      .populate('rejectedBy', 'name email');

    res.json({
      success: true,
      message: 'Purchase order rejected successfully',
      data: updatedPO
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
 * @desc    Start receiving items for purchase order
 * @route   PUT /api/purchase-orders/:id/start-receiving
 * @access  Private (Salon Admin/Staff)
 */
exports.startReceiving = async (req, res) => {
  try {
    const { id } = req.params;
    const salonId = req.user.salonId;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order must be approved before receiving'
      });
    }

    purchaseOrder.status = 'receiving';
    purchaseOrder.receivingStartDate = new Date();
    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Started receiving process for purchase order',
      data: purchaseOrder
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
 * @desc    Receive items for purchase order
 * @route   PUT /api/purchase-orders/:id/receive
 * @access  Private (Salon Admin/Staff)
 */
exports.receiveItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, receivingNotes, deliveryDate } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Process each received item
    for (const receivedItem of receivedItems) {
      const { productId, receivedQuantity, qualityStatus = 'approved', notes = '', expiryDate } = receivedItem;

      // Update purchase order item
      await purchaseOrder.receiveItem(productId, receivedQuantity, qualityStatus, notes);

      // Update product stock if quality is approved
      if (qualityStatus === 'approved') {
        const product = await Product.findById(productId);
        if (product) {
          // Add stock to product
          await product.addStock(receivedQuantity, 'purchase', notes, expiryDate);

          // Find the specific item in the purchase order
          const poItem = purchaseOrder.items.find(item => 
            item.productId.toString() === productId.toString()
          );

          // Create stock movement record
          const stockMovement = new StockMovement({
            productId: product._id,
            productName: product.productName,
            sku: product.sku,
            barcode: product.barcode,
            movementType: 'purchase_receipt',
            quantity: receivedQuantity,
            unit: product.unit,
            stockBefore: product.currentStock - receivedQuantity,
            stockAfter: product.currentStock,
            unitCost: poItem ? poItem.unitPrice : product.costPrice,
            totalValue: receivedQuantity * (poItem ? poItem.unitPrice : product.costPrice),
            referenceType: 'purchase_order',
            referenceId: purchaseOrder._id,
            referenceNumber: purchaseOrder.poNumber,
            supplierId: purchaseOrder.supplierId,
            supplierName: purchaseOrder.supplierName,
            salonId: salonId,
            performedBy: userId,
            performedByName: req.user.name,
            notes: notes,
            qualityStatus: qualityStatus,
            expiryDate: expiryDate,
            deliveryDate: deliveryDate,
            createdBy: userId
          });

          await stockMovement.save();
        }
      }
    }

    // Update receiving information
    purchaseOrder.receivedBy = userId;
    purchaseOrder.receivingNotes = receivingNotes;
    purchaseOrder.actualDeliveryDate = deliveryDate || new Date();

    await purchaseOrder.save();

    const updatedPO = await PurchaseOrder.findById(id)
      .populate('supplierId', 'supplierName contactPersonName')
      .populate('receivedBy', 'name email');

    res.json({
      success: true,
      message: 'Items received successfully',
      data: updatedPO
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
 * @desc    Complete purchase order
 * @route   PUT /api/purchase-orders/:id/complete
 * @access  Private (Salon Admin)
 */
exports.completePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;
    const salonId = req.user.salonId;

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if all items are received
    const allItemsReceived = purchaseOrder.items.every(item => 
      item.receivedQuantity >= item.orderedQuantity || item.status === 'cancelled'
    );

    if (!allItemsReceived) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete purchase order - not all items have been received'
      });
    }

    purchaseOrder.status = 'completed';
    purchaseOrder.completionDate = new Date();
    purchaseOrder.completionNotes = completionNotes;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order completed successfully',
      data: purchaseOrder
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
 * @desc    Cancel purchase order
 * @route   PUT /api/purchase-orders/:id/cancel
 * @access  Private (Salon Admin)
 */
exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const salonId = req.user.salonId;

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (purchaseOrder.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed purchase orders'
      });
    }

    purchaseOrder.status = 'cancelled';
    purchaseOrder.cancellationReason = cancellationReason;
    purchaseOrder.cancellationDate = new Date();

    // Update all items to cancelled status
    purchaseOrder.items = purchaseOrder.items.map(item => ({
      ...item.toObject(),
      status: 'cancelled'
    }));

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order cancelled successfully',
      data: purchaseOrder
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
 * @desc    Get purchase order analytics
 * @route   GET /api/purchase-orders/analytics
 * @access  Private (Salon Admin)
 */
exports.getPurchaseOrderAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { startDate, endDate, supplierId } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const matchStage = {
      salonId: salonId,
      poDate: { $gte: start, $lte: end }
    };

    if (supplierId) {
      matchStage.supplierId = supplierId;
    }

    // Overall purchase order statistics
    const overallStats = await PurchaseOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedOrders: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Orders by supplier
    const ordersBySupplier = await PurchaseOrder.aggregate([
      { $match: matchStage },
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

    // Monthly trend
    const monthlyTrend = await PurchaseOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$poDate' },
            month: { $month: '$poDate' }
          },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top products ordered
    const topProducts = await PurchaseOrder.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalOrdered: { $sum: '$items.orderedQuantity' },
          totalReceived: { $sum: '$items.receivedQuantity' },
          totalValue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overallStats: overallStats[0] || {},
        ordersBySupplier,
        monthlyTrend,
        topProducts,
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
 * @desc    Generate purchase order report
 * @route   GET /api/purchase-orders/report
 * @access  Private (Salon Admin)
 */
exports.generatePurchaseOrderReport = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { 
      startDate, 
      endDate, 
      supplierId, 
      status, 
      reportType = 'summary' 
    } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filter = {
      salonId,
      poDate: { $gte: start, $lte: end }
    };

    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;

    let reportData;

    if (reportType === 'detailed') {
      // Detailed report with all purchase orders
      reportData = await PurchaseOrder.find(filter)
        .populate('supplierId', 'supplierName contactPersonName')
        .populate('createdBy', 'name')
        .sort({ poDate: -1 });
    } else {
      // Summary report
      reportData = await PurchaseOrder.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            totalItems: { $sum: { $size: '$items' } },
            statusBreakdown: {
              $push: '$status'
            },
            supplierBreakdown: {
              $push: {
                supplierId: '$supplierId',
                supplierName: '$supplierName',
                value: '$totalAmount'
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
        filters: { supplierId, status },
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