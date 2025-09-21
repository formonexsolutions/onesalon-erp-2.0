const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    sku: { type: String, unique: true, sparse: true }, // Stock Keeping Unit
    barcode: { type: String, unique: true, sparse: true },
    category: { 
      type: String, 
      required: true,
      enum: ['hair_care', 'skin_care', 'makeup', 'tools', 'equipment', 'disposables', 'supplements', 'accessories', 'cleaning', 'other']
    },
    subCategory: { type: String },
    brand: { type: String },
    
    // Pricing
    costPrice: { type: Number, required: true }, // Purchase price
    unitPrice: { type: Number, required: true }, // Base selling price
    sellingPrice: { type: Number, required: true }, // Current selling price
    margin: { type: Number }, // Profit margin percentage
    
    // Stock management
    currentStock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 }, // Stock allocated but not yet consumed
    availableStock: { type: Number, default: 0, min: 0 }, // currentStock - reservedStock
    minStock: { type: Number, required: true, min: 0 },
    maxStock: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, required: true, min: 0 },
    reorderQuantity: { type: Number, required: true, min: 1 },
    
    // Product details
    description: { type: String },
    unit: { 
      type: String, 
      required: true,
      enum: ['pieces', 'ml', 'gm', 'kg', 'liters', 'bottles', 'tubes', 'packs', 'boxes']
    },
    weight: { type: Number }, // Product weight
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number }
    },
    
    // Supplier information
    suppliers: [{
      supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
      supplierName: { type: String },
      supplierPrice: { type: Number },
      leadTime: { type: Number }, // Days
      minimumOrderQuantity: { type: Number },
      isPrimary: { type: Boolean, default: false }
    }],
    
    // Product lifecycle
    expiryDate: { type: Date },
    manufacturingDate: { type: Date },
    batchNumber: { type: String },
    serialNumber: { type: String },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Location tracking
    location: {
      shelf: { type: String },
      section: { type: String },
      position: { type: String }
    },
    
    // Status indicators
    stockStatus: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock', 'reorder-needed', 'excess-stock'],
      default: 'in-stock'
    },
    
    // Product attributes
    isConsumable: { type: Boolean, default: true }, // Can be consumed/used up
    isTrackable: { type: Boolean, default: true }, // Track individual units
    isActive: { type: Boolean, default: true },
    isTaxable: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 }, // Tax percentage
    
    // Usage tracking
    totalConsumed: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    
    // Alerts and notifications
    lowStockAlert: { type: Boolean, default: true },
    expiryAlert: { type: Boolean, default: true },
    expiryAlertDays: { type: Number, default: 30 }, // Days before expiry to alert
    
    // Product images
    images: [{
      url: { type: String },
      altText: { type: String },
      isPrimary: { type: Boolean, default: false }
    }],
    
    // Notes and tags
    notes: { type: String },
    tags: [{ type: String }],
    
    // Analytics
    analytics: {
      averageConsumptionPerMonth: { type: Number, default: 0 },
      lastConsumedDate: { type: Date },
      lastPurchaseDate: { type: Date },
      fastMoving: { type: Boolean, default: false },
      slowMoving: { type: Boolean, default: false }
    },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for better performance
ProductSchema.index({ salonId: 1, category: 1 });
ProductSchema.index({ salonId: 1, stockStatus: 1 });
ProductSchema.index({ salonId: 1, productName: 1 });

// Virtual for available stock calculation
ProductSchema.virtual('availableStockCalculated').get(function() {
  return Math.max(0, this.currentStock - this.reservedStock);
});

// Pre-save middleware to update stock status and available stock
ProductSchema.pre('save', function(next) {
  // Calculate available stock
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
  
  // Update stock status based on current stock
  if (this.currentStock <= 0) {
    this.stockStatus = 'out-of-stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.stockStatus = 'reorder-needed';
  } else if (this.currentStock <= this.minStock) {
    this.stockStatus = 'low-stock';
  } else if (this.currentStock >= this.maxStock) {
    this.stockStatus = 'excess-stock';
  } else {
    this.stockStatus = 'in-stock';
  }
  
  // Calculate margin if not provided
  if (!this.margin && this.costPrice && this.sellingPrice) {
    this.margin = ((this.sellingPrice - this.costPrice) / this.costPrice) * 100;
  }
  
  next();
});

// Instance methods
ProductSchema.methods.isExpiringSoon = function(days = 30) {
  if (!this.expiryDate) return false;
  const daysUntilExpiry = Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= days && daysUntilExpiry > 0;
};

ProductSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
};

ProductSchema.methods.needsReorder = function() {
  return this.currentStock <= this.reorderLevel;
};

ProductSchema.methods.addStock = function(quantity, type = 'purchase', notes = '') {
  this.currentStock += quantity;
  if (type === 'purchase') {
    this.totalPurchased += quantity;
    this.analytics.lastPurchaseDate = new Date();
  }
  return this.save();
};

ProductSchema.methods.consumeStock = function(quantity, notes = '') {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available');
  }
  this.currentStock -= quantity;
  this.totalConsumed += quantity;
  this.analytics.lastConsumedDate = new Date();
  return this.save();
};

ProductSchema.methods.reserveStock = function(quantity) {
  if (this.availableStock < quantity) {
    throw new Error('Insufficient stock available for reservation');
  }
  this.reservedStock += quantity;
  return this.save();
};

ProductSchema.methods.releaseReservedStock = function(quantity) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);
  return this.save();
};

// Static methods
ProductSchema.statics.findLowStock = function(salonId) {
  return this.find({
    salonId: salonId,
    stockStatus: { $in: ['low-stock', 'out-of-stock', 'reorder-needed'] },
    isActive: true
  });
};

ProductSchema.statics.findExpiringSoon = function(salonId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    salonId: salonId,
    expiryDate: { $lte: futureDate, $gt: new Date() },
    isActive: true
  });
};

ProductSchema.statics.getStockAnalytics = function(salonId) {
  return this.aggregate([
    { $match: { salonId: mongoose.Types.ObjectId(salonId), isActive: true } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStockValue: { $sum: { $multiply: ['$currentStock', '$costPrice'] } },
        lowStockProducts: {
          $sum: {
            $cond: [{ $in: ['$stockStatus', ['low-stock', 'out-of-stock', 'reorder-needed']] }, 1, 0]
          }
        },
        averageStockLevel: { $avg: '$currentStock' }
      }
    }
  ]);
};

module.exports = mongoose.model('Product', ProductSchema);