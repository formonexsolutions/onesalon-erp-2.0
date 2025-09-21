const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const StockMovement = require('../models/StockMovement');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all products with filtering and pagination
 * @route   GET /api/inventory/products
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      category,
      stockStatus,
      sortBy = 'productName',
      sortOrder = 'asc',
      search
    } = req.query;

    // Build filter object
    const filter = { salonId, isActive: true };

    if (category) {
      filter.category = category;
    }

    if (stockStatus) {
      filter.stockStatus = stockStatus;
    }

    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get products
    const products = await Product.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('modifiedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: products,
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
 * @desc    Get product by ID
 * @route   GET /api/inventory/products/:id
 * @access  Private (Salon Admin/Staff)
 */
exports.getProductById = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, salonId })
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
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
 * @desc    Create new product
 * @route   POST /api/inventory/products
 * @access  Private (Salon Admin)
 */
exports.createProduct = async (req, res) => {
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
      productName,
      barcode,
      category,
      brand,
      unitPrice,
      sellingPrice,
      currentStock,
      minStock,
      maxStock,
      description,
      unit
    } = req.body;

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode, salonId });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists'
        });
      }
    }

    // Create product
    const product = new Product({
      productName,
      barcode,
      category,
      brand,
      unitPrice,
      sellingPrice,
      currentStock: currentStock || 0,
      minStock,
      maxStock,
      description,
      unit,
      salonId,
      createdBy: userId
    });

    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
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
 * @desc    Update product
 * @route   PUT /api/inventory/products/:id
 * @access  Private (Salon Admin)
 */
exports.updateProduct = async (req, res) => {
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

    // Find existing product
    const existingProduct = await Product.findOne({ _id: id, salonId });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      productName,
      barcode,
      category,
      brand,
      unitPrice,
      sellingPrice,
      minStock,
      maxStock,
      description,
      unit
    } = req.body;

    // Check if barcode already exists (if changed)
    if (barcode && barcode !== existingProduct.barcode) {
      const duplicateProduct = await Product.findOne({ barcode, salonId, _id: { $ne: id } });
      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists'
        });
      }
    }

    // Update product
    const updateData = {
      productName,
      barcode,
      category,
      brand,
      unitPrice,
      sellingPrice,
      minStock,
      maxStock,
      description,
      unit,
      modifiedBy: userId
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('modifiedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
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
 * @desc    Update product stock
 * @route   PATCH /api/inventory/products/:id/stock
 * @access  Private (Salon Admin/Staff)
 */
exports.updateProductStock = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const userId = req.user._id;
    const { id } = req.params;
    const { quantity, operation, reason } = req.body; // operation: 'add' or 'subtract'

    if (!['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }

    const product = await Product.findOne({ _id: id, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate new stock
    let newStock = product.currentStock;
    if (operation === 'add') {
      newStock += quantity;
    } else {
      newStock -= quantity;
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
    }

    // Update stock
    product.currentStock = newStock;
    product.modifiedBy = userId;
    await product.save();

    // TODO: Log stock movement in a separate collection for audit trail

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        productId: product._id,
        productName: product.productName,
        previousStock: product.currentStock - (operation === 'add' ? quantity : -quantity),
        newStock: product.currentStock,
        stockStatus: product.stockStatus
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
 * @desc    Delete product
 * @route   DELETE /api/inventory/products/:id
 * @access  Private (Salon Admin only)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { id } = req.params;

    // Soft delete by setting isActive to false
    const product = await Product.findOneAndUpdate(
      { _id: id, salonId },
      { isActive: false, modifiedBy: req.user._id },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
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
 * @desc    Get inventory statistics
 * @route   GET /api/inventory/stats
 * @access  Private (Salon Admin/Staff)
 */
exports.getInventoryStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    // Basic counts
    const totalProducts = await Product.countDocuments({ salonId, isActive: true });
    const inStockProducts = await Product.countDocuments({ salonId, isActive: true, stockStatus: 'in-stock' });
    const lowStockProducts = await Product.countDocuments({ salonId, isActive: true, stockStatus: 'low-stock' });
    const outOfStockProducts = await Product.countDocuments({ salonId, isActive: true, stockStatus: 'out-of-stock' });

    // Category distribution
    const categoryStats = await Product.aggregate([
      { $match: { salonId, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } } } },
      { $sort: { count: -1 } }
    ]);

    // Total inventory value
    const inventoryValue = await Product.aggregate([
      { $match: { salonId, isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } } } }
    ]);

    const totalInventoryValue = inventoryValue.length > 0 ? inventoryValue[0].totalValue : 0;

    // Recent stock movements (placeholder - would need stock movement tracking)
    const recentlyUpdated = await Product.find({ salonId, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('productName currentStock stockStatus updatedAt');

    res.json({
      success: true,
      data: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        categoryStats,
        recentlyUpdated,
        stockDistribution: {
          inStock: inStockProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts
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
 * @desc    Get low stock alert products
 * @route   GET /api/inventory/low-stock
 * @access  Private (Salon Admin/Staff)
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const lowStockProducts = await Product.find({
      salonId,
      isActive: true,
      $or: [
        { stockStatus: 'low-stock' },
        { stockStatus: 'out-of-stock' }
      ]
    }).sort({ currentStock: 1, productName: 1 });

    res.json({
      success: true,
      data: lowStockProducts
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
 * @desc    Get all suppliers
 * @route   GET /api/inventory/suppliers
 * @access  Private (Salon Admin/Staff)
 */
exports.getAllSuppliers = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'supplierName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { salonId, isActive: true };

    if (search) {
      filter.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { contactPersonName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get suppliers
    const suppliers = await Supplier.find(filter)
      .populate('createdBy', 'firstName lastName')
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
 * @desc    Create new supplier
 * @route   POST /api/inventory/suppliers
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

    const {
      supplierName,
      contactPersonName,
      phoneNumber,
      email,
      address,
      gstNumber,
      panNumber
    } = req.body;

    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ email, salonId });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier with this email already exists'
      });
    }

    // Create supplier
    const supplier = new Supplier({
      supplierName,
      contactPersonName,
      phoneNumber,
      email,
      address,
      gstNumber,
      panNumber,
      salonId,
      createdBy: userId
    });

    await supplier.save();

    const populatedSupplier = await Supplier.findById(supplier._id)
      .populate('createdBy', 'firstName lastName');

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
 * @desc    Add stock to product
 * @route   PATCH /api/inventory/products/:id/stock/add
 * @access  Private (Salon Admin/Staff)
 */
exports.addProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, notes, expiryDate, batchNumber } = req.body;
    const salonId = req.user.salonId;

    const product = await Product.findOne({ _id: id, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const stockBefore = product.currentStock;
    await product.addStock(quantity, reason, notes, expiryDate);

    // Create stock movement record
    const stockMovement = new StockMovement({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      movementType: 'adjustment_positive',
      quantity,
      unit: product.unit,
      stockBefore,
      stockAfter: product.currentStock,
      unitCost: product.costPrice,
      totalValue: quantity * product.costPrice,
      referenceType: 'manual_adjustment',
      reason,
      notes,
      expiryDate,
      batchNumber,
      salonId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      createdBy: req.user._id
    });

    await stockMovement.save();

    res.json({
      success: true,
      message: 'Stock added successfully',
      data: {
        product: product.productName,
        quantityAdded: quantity,
        newStock: product.currentStock,
        stockStatus: product.stockStatus
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
 * @desc    Consume product stock
 * @route   PATCH /api/inventory/products/:id/stock/consume
 * @access  Private (Salon Admin/Staff)
 */
exports.consumeProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, notes, appointmentId, customerId } = req.body;
    const salonId = req.user.salonId;

    const product = await Product.findOne({ _id: id, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    const stockBefore = product.currentStock;
    await product.consumeStock(quantity, reason);

    // Create stock movement record
    const stockMovement = new StockMovement({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      movementType: 'consumption',
      quantity,
      unit: product.unit,
      stockBefore,
      stockAfter: product.currentStock,
      unitCost: product.costPrice,
      totalValue: quantity * product.costPrice,
      referenceType: appointmentId ? 'appointment' : 'manual_adjustment',
      referenceId: appointmentId,
      customerId,
      reason,
      notes,
      salonId,
      performedBy: req.user._id,
      performedByName: req.user.name,
      createdBy: req.user._id
    });

    await stockMovement.save();

    res.json({
      success: true,
      message: 'Stock consumed successfully',
      data: {
        product: product.productName,
        quantityConsumed: quantity,
        remainingStock: product.currentStock,
        stockStatus: product.stockStatus
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
 * @desc    Get product analytics
 * @route   GET /api/inventory/products/:id/analytics
 * @access  Private (Salon Admin)
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const salonId = req.user.salonId;

    const product = await Product.findOne({ _id: id, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Get stock movements analytics
    const movementAnalytics = await StockMovement.aggregate([
      {
        $match: {
          productId: product._id,
          salonId,
          movementDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$movementType',
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate analytics
    const analytics = await product.getAnalytics();

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
        analytics,
        movementAnalytics,
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
 * @desc    Get expiring products
 * @route   GET /api/inventory/expiring-soon
 * @access  Private (Salon Admin/Staff)
 */
exports.getExpiringSoonProducts = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { days = 30 } = req.query;

    const expiringProducts = await Product.findExpiringSoon(salonId, parseInt(days));

    res.json({
      success: true,
      data: expiringProducts,
      count: expiringProducts.length,
      expiryWindow: `${days} days`
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
 * @desc    Get purchase orders with filtering
 * @route   GET /api/inventory/purchase-orders
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
      sortBy = 'poDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (status) {
      filter.status = status;
    }

    if (supplierId) {
      filter.supplierId = supplierId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get purchase orders
    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'supplierName contactPersonName')
      .populate('createdBy', 'name email')
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
 * @desc    Create purchase order
 * @route   POST /api/inventory/purchase-orders
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
      notes
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

      const processedItem = {
        productId: product._id,
        productName: product.productName,
        sku: product.sku,
        orderedQuantity: item.quantity,
        quantity: item.quantity, // Backward compatibility
        unitPrice: item.unitPrice || product.costPrice,
        totalPrice: (item.quantity * (item.unitPrice || product.costPrice)),
        unit: product.unit,
        notes: item.notes
      };

      processedItems.push(processedItem);
      subtotal += processedItem.totalPrice;
    }

    // Create purchase order
    const purchaseOrder = new PurchaseOrder({
      supplierId,
      supplierName: supplier.supplierName,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phoneNumber,
      items: processedItems,
      subtotal,
      totalAmount: subtotal,
      expectedDeliveryDate,
      paymentTerms,
      deliveryTerms,
      notes,
      salonId,
      createdBy: userId
    });

    await purchaseOrder.save();

    const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplierId', 'supplierName contactPersonName')
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
 * @desc    Receive purchase order items
 * @route   PUT /api/inventory/purchase-orders/:id/receive
 * @access  Private (Salon Admin/Staff)
 */
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, receivingNotes } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    // Find purchase order
    const purchaseOrder = await PurchaseOrder.findOne({ _id: id, salonId });
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Process received items
    for (const receivedItem of receivedItems) {
      const { productId, receivedQuantity, qualityStatus = 'approved', notes = '' } = receivedItem;

      // Update purchase order item
      await purchaseOrder.receiveItem(productId, receivedQuantity, qualityStatus, notes);

      // Update product stock if quality is approved
      if (qualityStatus === 'approved') {
        const product = await Product.findById(productId);
        if (product) {
          await product.addStock(receivedQuantity, 'purchase', notes);

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
            unitCost: receivedItem.unitPrice || product.costPrice,
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
            createdBy: userId
          });

          await stockMovement.save();
        }
      }
    }

    // Update receiving information
    purchaseOrder.receivedBy = userId;
    purchaseOrder.receivingNotes = receivingNotes;

    await purchaseOrder.save();

    res.json({
      success: true,
      message: 'Purchase order items received successfully',
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
 * @desc    Get stock movements
 * @route   GET /api/inventory/stock-movements
 * @access  Private (Salon Admin/Staff)
 */
exports.getStockMovements = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const {
      page = 1,
      limit = 10,
      productId,
      movementType,
      startDate,
      endDate,
      sortBy = 'movementDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { salonId };

    if (productId) filter.productId = productId;
    if (movementType) filter.movementType = movementType;
    
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
      .populate('productId', 'productName sku')
      .populate('performedBy', 'name email')
      .populate('supplierId', 'supplierName')
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
 * @desc    Consume product stock
 * @route   POST /api/inventory/consume-stock
 * @access  Private (Salon Admin/Staff)
 */
exports.consumeStock = async (req, res) => {
  try {
    const { productId, quantity, reason, appointmentId, customerId } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    // Find product
    const product = await Product.findOne({ _id: productId, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (product.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Consume stock
    const stockBefore = product.currentStock;
    await product.consumeStock(quantity, reason);

    // Create stock movement record
    const stockMovement = new StockMovement({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      movementType: 'consumption',
      quantity: quantity,
      unit: product.unit,
      stockBefore: stockBefore,
      stockAfter: product.currentStock,
      unitCost: product.costPrice,
      referenceType: appointmentId ? 'appointment' : 'manual_adjustment',
      referenceId: appointmentId,
      customerId: customerId,
      salonId: salonId,
      performedBy: userId,
      performedByName: req.user.name,
      reason: reason,
      notes: `Stock consumed for: ${reason}`,
      createdBy: userId
    });

    await stockMovement.save();

    res.json({
      success: true,
      message: 'Stock consumed successfully',
      data: {
        product: product.productName,
        quantityConsumed: quantity,
        remainingStock: product.currentStock,
        stockStatus: product.stockStatus
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
 * @desc    Adjust product stock
 * @route   POST /api/inventory/adjust-stock
 * @access  Private (Salon Admin)
 */
exports.adjustStock = async (req, res) => {
  try {
    const { productId, newQuantity, reason } = req.body;
    const salonId = req.user.salonId;
    const userId = req.user._id;

    // Find product
    const product = await Product.findOne({ _id: productId, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const oldQuantity = product.currentStock;
    const difference = newQuantity - oldQuantity;
    const movementType = difference > 0 ? 'adjustment_positive' : 'adjustment_negative';

    // Update product stock
    product.currentStock = newQuantity;
    await product.save();

    // Create stock movement record
    const stockMovement = new StockMovement({
      productId: product._id,
      productName: product.productName,
      sku: product.sku,
      barcode: product.barcode,
      movementType: movementType,
      quantity: Math.abs(difference),
      unit: product.unit,
      stockBefore: oldQuantity,
      stockAfter: newQuantity,
      unitCost: product.costPrice,
      referenceType: 'manual_adjustment',
      salonId: salonId,
      performedBy: userId,
      performedByName: req.user.name,
      reason: reason,
      notes: `Stock adjusted from ${oldQuantity} to ${newQuantity}. Reason: ${reason}`,
      approvalRequired: Math.abs(difference) > 10, // Require approval for large adjustments
      createdBy: userId
    });

    await stockMovement.save();

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        product: product.productName,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
        difference: difference,
        stockStatus: product.stockStatus
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
 * @desc    Get inventory analytics
 * @route   GET /api/inventory/analytics
 * @access  Private (Salon Admin)
 */
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Basic inventory stats
    const inventoryStats = await Product.getStockAnalytics(salonId);
    
    // Low stock products
    const lowStockProducts = await Product.findLowStock(salonId);
    
    // Expiring products
    const expiringProducts = await Product.findExpiringSoon(salonId, 30);
    
    // Movement analytics
    const movementAnalytics = await StockMovement.getMovementAnalytics(salonId, start, end);
    
    // Top moving products
    const topMovingProducts = await StockMovement.getTopMovingProducts(salonId, 30, 10);
    
    // Purchase order analytics
    const poAnalytics = await PurchaseOrder.getAnalytics ? 
      await PurchaseOrder.getAnalytics(salonId, start, end) : [];

    res.json({
      success: true,
      data: {
        inventoryStats: inventoryStats[0] || {},
        lowStockProducts: lowStockProducts.slice(0, 10),
        expiringProducts: expiringProducts.slice(0, 10),
        movementAnalytics,
        topMovingProducts,
        purchaseOrderAnalytics: poAnalytics[0] || {},
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
 * @route   GET /api/inventory/products/:id/history
 * @access  Private (Salon Admin/Staff)
 */
exports.getProductStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const salonId = req.user.salonId;

    // Verify product exists
    const product = await Product.findOne({ _id: id, salonId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get stock history
    const stockHistory = await StockMovement.getStockHistory(salonId, id, parseInt(days));

    res.json({
      success: true,
      data: {
        product: {
          id: product._id,
          name: product.productName,
          currentStock: product.currentStock,
          stockStatus: product.stockStatus
        },
        history: stockHistory,
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