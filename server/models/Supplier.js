const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    // Basic Information
    supplierName: { type: String, required: true },
    companyName: { type: String },
    supplierCode: { type: String, unique: true, sparse: true },
    
    // Contact Information
    contactPersonName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    alternatePhone: { type: String },
    
    // Address Information
    address: { type: String },
    detailedAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'India' }
    },
    
    // Business Information
    businessType: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'importer', 'agent'],
      default: 'distributor'
    },
    
    // Tax and Legal Information
    gstNumber: { type: String },
    panNumber: { type: String },
    businessLicense: { type: String },
    
    // Payment Terms
    paymentTerms: {
      type: String,
      enum: ['cash', 'net_15', 'net_30', 'net_45', 'net_60', 'advance'],
      default: 'net_30'
    },
    creditLimit: { type: Number, default: 0 },
    creditPeriod: { type: Number, default: 30 }, // Days
    
    // Supplier Categories
    categories: [{
      type: String,
      enum: ['hair_care', 'skin_care', 'makeup', 'tools', 'equipment', 'disposables', 'supplements', 'accessories', 'cleaning', 'other']
    }],
    
    // Performance Metrics
    rating: { type: Number, min: 1, max: 5, default: 3 },
    reliability: { type: Number, min: 1, max: 5, default: 3 },
    qualityScore: { type: Number, min: 1, max: 5, default: 3 },
    deliveryScore: { type: Number, min: 1, max: 5, default: 3 },
    
    // Delivery Information
    deliveryTime: { type: Number, default: 7 }, // Average delivery time in days
    minimumOrderValue: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 0 },
    
    // Banking Information
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String }
    },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted', 'pending_approval'],
      default: 'active'
    },
    isActive: { type: Boolean, default: true },
    
    // Purchase history summary (enhanced)
    totalOrders: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    
    // Enhanced analytics
    analytics: {
      onTimeDeliveries: { type: Number, default: 0 },
      totalDeliveries: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 }, // Percentage
      qualityIssues: { type: Number, default: 0 }
    },
    
    // Contract Information
    contractStartDate: { type: Date },
    contractEndDate: { type: Date },
    
    // Notes
    notes: { type: String },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes
SupplierSchema.index({ salonId: 1, supplierName: 1 });
SupplierSchema.index({ salonId: 1, status: 1 });
SupplierSchema.index({ email: 1 });

// Virtual for delivery performance
SupplierSchema.virtual('deliveryPerformance').get(function() {
  if (this.analytics.totalDeliveries === 0) return 0;
  return (this.analytics.onTimeDeliveries / this.analytics.totalDeliveries) * 100;
});

// Instance methods
SupplierSchema.methods.updateRating = function() {
  const weights = {
    quality: 0.3,
    delivery: 0.3,
    reliability: 0.25,
    pricing: 0.15
  };
  
  this.rating = (
    this.qualityScore * weights.quality +
    this.deliveryScore * weights.delivery +
    this.reliability * weights.reliability +
    3 * weights.pricing // Default pricing score
  );
  
  return this.save();
};

SupplierSchema.methods.addOrder = function(orderValue, deliveredOnTime = true) {
  this.totalOrders += 1;
  this.totalAmount += orderValue;
  this.averageOrderValue = this.totalAmount / this.totalOrders;
  this.lastOrderDate = new Date();
  
  this.analytics.totalDeliveries += 1;
  if (deliveredOnTime) {
    this.analytics.onTimeDeliveries += 1;
  }
  
  return this.save();
};

SupplierSchema.methods.isContractValid = function() {
  if (!this.contractEndDate) return true;
  return this.contractEndDate > new Date();
};

SupplierSchema.methods.daysUntilContractExpiry = function() {
  if (!this.contractEndDate) return null;
  const today = new Date();
  const timeDiff = this.contractEndDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Static methods
SupplierSchema.statics.findActiveSuppliers = function(salonId) {
  return this.find({ salonId: salonId, status: 'active' });
};

SupplierSchema.statics.findByCategory = function(salonId, category) {
  return this.find({ 
    salonId: salonId, 
    categories: category, 
    status: 'active' 
  });
};

SupplierSchema.statics.getTopSuppliers = function(salonId, limit = 10) {
  return this.find({ salonId: salonId, status: 'active' })
    .sort({ totalAmount: -1, rating: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Supplier', SupplierSchema);