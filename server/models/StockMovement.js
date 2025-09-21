const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema(
  {
    // Movement Identification
    movementId: { type: String, unique: true }, // Auto-generated
    movementDate: { type: Date, default: Date.now },
    movementTime: { type: String }, // HH:MM format
    
    // Product Information
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: { type: String, required: true },
    sku: { type: String },
    barcode: { type: String },
    
    // Movement Details
    movementType: {
      type: String,
      enum: [
        'purchase_receipt',    // Stock received from supplier
        'consumption',         // Stock used for services
        'sale',               // Stock sold to customer
        'adjustment_positive', // Stock increase (count correction)
        'adjustment_negative', // Stock decrease (count correction)
        'transfer_in',        // Stock received from another location
        'transfer_out',       // Stock sent to another location
        'return_to_supplier', // Stock returned to supplier
        'return_from_customer', // Stock returned by customer
        'expired',            // Stock removed due to expiry
        'damaged',            // Stock removed due to damage
        'wastage',            // Stock wasted/lost
        'opening_balance'     // Initial stock entry
      ],
      required: true
    },
    
    // Quantity Information
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    
    // Stock Levels (before and after)
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    
    // Pricing Information
    unitCost: { type: Number }, // Cost per unit at time of movement
    totalCost: { type: Number }, // Total cost of movement
    unitPrice: { type: Number }, // Selling price per unit (for sales)
    totalPrice: { type: Number }, // Total selling price (for sales)
    
    // Reference Information
    referenceType: {
      type: String,
      enum: ['purchase_order', 'appointment', 'manual_adjustment', 'stock_transfer', 'supplier_return', 'customer_return', 'expiry_check', 'damage_report']
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Reference to related document
    referenceNumber: { type: String }, // Human readable reference
    
    // Location Information
    fromLocation: {
      shelf: { type: String },
      section: { type: String },
      position: { type: String }
    },
    toLocation: {
      shelf: { type: String },
      section: { type: String },
      position: { type: String }
    },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Staff Information
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    performedByName: { type: String, required: true },
    
    // Additional Details
    reason: { type: String }, // Reason for the movement
    notes: { type: String }, // Additional notes
    batchNumber: { type: String },
    expiryDate: { type: Date },
    
    // Approval (for certain movement types)
    approvalRequired: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    approvedAt: { type: Date },
    approvalNotes: { type: String },
    
    // Quality Information (for receipts)
    qualityStatus: {
      type: String,
      enum: ['good', 'acceptable', 'poor', 'rejected'],
      default: 'good'
    },
    qualityNotes: { type: String },
    
    // Cost Center (for cost allocation)
    costCenter: { type: String },
    department: { type: String },
    
    // Supplier Information (for purchases/returns)
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    
    // Customer Information (for sales/returns)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String },
    
    // Document attachments
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadDate: { type: Date, default: Date.now }
    }],
    
    // Analytics flags
    isAdjustment: { type: Boolean, default: false },
    isAutomated: { type: Boolean, default: false }, // System generated vs manual
    isReversed: { type: Boolean, default: false }, // Indicates if this movement has been reversed
    reversalMovementId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockMovement' },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for better performance
StockMovementSchema.index({ salonId: 1, movementDate: -1 });
StockMovementSchema.index({ salonId: 1, productId: 1, movementDate: -1 });
StockMovementSchema.index({ salonId: 1, movementType: 1 });
StockMovementSchema.index({ referenceId: 1, referenceType: 1 });
StockMovementSchema.index({ performedBy: 1 });

// Pre-save middleware
StockMovementSchema.pre('save', function(next) {
  // Auto-generate movement ID
  if (!this.movementId && this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = Date.now().toString().slice(-4);
    this.movementId = `SM-${year}${month}${day}-${time}`;
  }
  
  // Set movement time if not provided
  if (!this.movementTime) {
    const now = new Date();
    this.movementTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Calculate total cost and price
  if (this.unitCost && this.quantity) {
    this.totalCost = Math.abs(this.quantity) * this.unitCost;
  }
  
  if (this.unitPrice && this.quantity) {
    this.totalPrice = Math.abs(this.quantity) * this.unitPrice;
  }
  
  // Set adjustment flag
  this.isAdjustment = ['adjustment_positive', 'adjustment_negative'].includes(this.movementType);
  
  next();
});

// Instance methods
StockMovementSchema.methods.isInboundMovement = function() {
  return [
    'purchase_receipt',
    'adjustment_positive',
    'transfer_in',
    'return_from_customer',
    'opening_balance'
  ].includes(this.movementType);
};

StockMovementSchema.methods.isOutboundMovement = function() {
  return [
    'consumption',
    'sale',
    'adjustment_negative',
    'transfer_out',
    'return_to_supplier',
    'expired',
    'damaged',
    'wastage'
  ].includes(this.movementType);
};

StockMovementSchema.methods.canBeReversed = function() {
  if (this.isReversed) return false;
  
  // Only certain movement types can be reversed
  const reversibleTypes = [
    'adjustment_positive',
    'adjustment_negative',
    'transfer_in',
    'transfer_out',
    'return_to_supplier',
    'return_from_customer'
  ];
  
  return reversibleTypes.includes(this.movementType);
};

StockMovementSchema.methods.reverse = function(reason, performedBy) {
  if (!this.canBeReversed()) {
    throw new Error('This movement cannot be reversed');
  }
  
  // Create opposite movement
  const oppositeType = this.getOppositeMovementType();
  if (!oppositeType) {
    throw new Error('Cannot determine opposite movement type');
  }
  
  const reverseMovement = new this.constructor({
    productId: this.productId,
    productName: this.productName,
    sku: this.sku,
    barcode: this.barcode,
    movementType: oppositeType,
    quantity: this.quantity, // Same quantity, opposite direction
    unit: this.unit,
    stockBefore: this.stockAfter,
    stockAfter: this.stockBefore,
    unitCost: this.unitCost,
    unitPrice: this.unitPrice,
    salonId: this.salonId,
    performedBy: performedBy,
    performedByName: performedBy.name,
    reason: `Reversal of ${this.movementId}: ${reason}`,
    referenceType: 'manual_adjustment',
    referenceNumber: `REV-${this.movementId}`,
    isAutomated: false,
    createdBy: performedBy
  });
  
  // Mark this movement as reversed
  this.isReversed = true;
  this.reversalMovementId = reverseMovement._id;
  
  return { originalMovement: this, reverseMovement };
};

StockMovementSchema.methods.getOppositeMovementType = function() {
  const opposites = {
    'adjustment_positive': 'adjustment_negative',
    'adjustment_negative': 'adjustment_positive',
    'transfer_in': 'transfer_out',
    'transfer_out': 'transfer_in',
    'return_to_supplier': 'purchase_receipt',
    'return_from_customer': 'sale'
  };
  
  return opposites[this.movementType];
};

// Static methods
StockMovementSchema.statics.findByProduct = function(salonId, productId, startDate, endDate) {
  const filter = { 
    salonId: salonId, 
    productId: productId 
  };
  
  if (startDate || endDate) {
    filter.movementDate = {};
    if (startDate) filter.movementDate.$gte = new Date(startDate);
    if (endDate) filter.movementDate.$lte = new Date(endDate);
  }
  
  return this.find(filter).sort({ movementDate: -1, createdAt: -1 });
};

StockMovementSchema.statics.getStockHistory = function(salonId, productId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    salonId: salonId,
    productId: productId,
    movementDate: { $gte: startDate }
  }).sort({ movementDate: 1 });
};

StockMovementSchema.statics.getMovementAnalytics = function(salonId, startDate, endDate) {
  const matchFilter = { salonId: mongoose.Types.ObjectId(salonId) };
  
  if (startDate && endDate) {
    matchFilter.movementDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }
  
  return this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$movementType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalCost: { $sum: '$totalCost' },
        totalPrice: { $sum: '$totalPrice' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

StockMovementSchema.statics.getTopMovingProducts = function(salonId, days = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        salonId: mongoose.Types.ObjectId(salonId),
        movementDate: { $gte: startDate },
        movementType: { $in: ['consumption', 'sale'] }
      }
    },
    {
      $group: {
        _id: '$productId',
        productName: { $first: '$productName' },
        totalMovement: { $sum: '$quantity' },
        movementCount: { $sum: 1 }
      }
    },
    { $sort: { totalMovement: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('StockMovement', StockMovementSchema);