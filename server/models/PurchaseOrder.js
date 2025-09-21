const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema(
  {
    // Order Identification
    poNumber: { type: String, unique: true }, // Auto-generated
    poDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
    
    // Supplier information
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    supplierName: { type: String },
    supplierEmail: { type: String },
    supplierPhone: { type: String },
    
    // Salon information
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Products ordered (enhanced)
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: { type: String, required: true },
      sku: { type: String },
      description: { type: String },
      
      // Quantities
      orderedQuantity: { type: Number, required: true, min: 1 },
      receivedQuantity: { type: Number, default: 0, min: 0 },
      pendingQuantity: { type: Number, default: 0, min: 0 },
      rejectedQuantity: { type: Number, default: 0, min: 0 },
      
      // Pricing
      unitPrice: { type: Number, required: true, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 },
      
      // Item specific details
      unit: { type: String, required: true },
      notes: { type: String },
      
      // Quality check
      qualityStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'partial'],
        default: 'pending'
      },
      qualityNotes: { type: String },
      
      // Backward compatibility
      quantity: { type: Number }, // Keep for backward compatibility
      expectedDeliveryDate: { type: Date }
    }],
    
    // Totals
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    deliveryCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    // Terms and conditions
    paymentTerms: { type: String },
    deliveryTerms: { type: String },
    termsOfSale: { type: String },
    
    // Status tracking (enhanced)
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'sent', 'acknowledged', 'partial_received', 'partially-delivered', 'received', 'delivered', 'completed', 'cancelled'],
      default: 'draft'
    },
    
    // Approval Workflow
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    approvedAt: { type: Date },
    approvalNotes: { type: String },
    
    // Receiving Information
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    receivedAt: { type: Date },
    receivingNotes: { type: String },
    
    // Invoice Information
    invoiceNumber: { type: String },
    invoiceDate: { type: Date },
    invoiceAmount: { type: Number },
    
    // Payment Information
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentDueDate: { type: Date },
    
    // Delivery Information
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'India' }
    },
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery', 'courier', 'transport'],
      default: 'delivery'
    },
    trackingNumber: { type: String },
    
    // Documents and attachments
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadDate: { type: Date, default: Date.now }
    }],
    
    // Notes
    notes: { type: String },
    internalNotes: { type: String },
    
    // Analytics and tracking
    isUrgent: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    
    // Revision tracking
    revisionNumber: { type: Number, default: 1 },
    originalPoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes
PurchaseOrderSchema.index({ salonId: 1, poNumber: 1 });
PurchaseOrderSchema.index({ salonId: 1, status: 1 });
PurchaseOrderSchema.index({ salonId: 1, supplierId: 1 });
PurchaseOrderSchema.index({ poDate: 1 });
PurchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Generate PO number before saving (enhanced)
PurchaseOrderSchema.pre('save', async function (next) {
  if (!this.poNumber && this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PurchaseOrder').countDocuments({ 
      createdAt: { 
        $gte: new Date(year, 0, 1), 
        $lt: new Date(year + 1, 0, 1) 
      } 
    });
    this.poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate subtotal and total amount
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((total, item) => {
      // Use orderedQuantity if available, fallback to quantity for backward compatibility
      const quantity = item.orderedQuantity || item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      item.totalPrice = quantity * unitPrice;
      return total + item.totalPrice;
    }, 0);
    
    this.totalAmount = this.subtotal + (this.taxAmount || 0) + (this.deliveryCharges || 0) - (this.discountAmount || 0);
  }
  
  // Update pending quantities for items
  this.items.forEach(item => {
    if (item.orderedQuantity !== undefined) {
      item.pendingQuantity = (item.orderedQuantity || 0) - (item.receivedQuantity || 0) - (item.rejectedQuantity || 0);
    }
    
    // Backward compatibility - sync quantity with orderedQuantity
    if (item.orderedQuantity && !item.quantity) {
      item.quantity = item.orderedQuantity;
    }
  });
  
  next();
});

// Instance methods
PurchaseOrderSchema.methods.canBeModified = function() {
  return ['draft', 'pending'].includes(this.status);
};

PurchaseOrderSchema.methods.canBeCancelled = function() {
  return ['draft', 'pending', 'approved', 'sent'].includes(this.status);
};

PurchaseOrderSchema.methods.isOverdue = function() {
  if (!this.expectedDeliveryDate) return false;
  return this.expectedDeliveryDate < new Date() && !['received', 'delivered', 'completed', 'cancelled'].includes(this.status);
};

PurchaseOrderSchema.methods.receiveItem = function(productId, receivedQuantity, qualityStatus = 'approved', notes = '') {
  const item = this.items.find(item => item.productId.toString() === productId.toString());
  if (!item) {
    throw new Error('Product not found in this purchase order');
  }
  
  const currentPending = item.pendingQuantity || (item.orderedQuantity || item.quantity || 0) - (item.receivedQuantity || 0);
  if (receivedQuantity > currentPending) {
    throw new Error('Received quantity cannot exceed pending quantity');
  }
  
  item.receivedQuantity = (item.receivedQuantity || 0) + receivedQuantity;
  item.qualityStatus = qualityStatus;
  if (notes) item.qualityNotes = notes;
  
  // Update PO status based on received items
  this.updateStatus();
  
  return this.save();
};

PurchaseOrderSchema.methods.updateStatus = function() {
  const totalOrdered = this.items.reduce((sum, item) => sum + (item.orderedQuantity || item.quantity || 0), 0);
  const totalReceived = this.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
  
  if (totalReceived === 0) {
    // No items received yet - keep current status if sent/approved
    return;
  } else if (totalReceived === totalOrdered) {
    // All items received
    this.status = 'received';
    this.receivedAt = new Date();
  } else if (totalReceived > 0) {
    // Partially received
    this.status = 'partial_received';
  }
};

PurchaseOrderSchema.methods.approve = function(approvedBy, notes = '') {
  if (this.status !== 'pending') {
    throw new Error('Only pending purchase orders can be approved');
  }
  
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalNotes = notes;
  
  return this.save();
};

PurchaseOrderSchema.methods.send = function() {
  if (!['approved', 'draft'].includes(this.status)) {
    throw new Error('Only approved or draft purchase orders can be sent');
  }
  
  this.status = 'sent';
  return this.save();
};

PurchaseOrderSchema.methods.cancel = function(reason = '') {
  if (!this.canBeCancelled()) {
    throw new Error('This purchase order cannot be cancelled');
  }
  
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  
  return this.save();
};

// Static methods
PurchaseOrderSchema.statics.findOverdue = function(salonId) {
  return this.find({
    salonId: salonId,
    expectedDeliveryDate: { $lt: new Date() },
    status: { $nin: ['received', 'delivered', 'completed', 'cancelled'] }
  });
};

PurchaseOrderSchema.statics.findByStatus = function(salonId, status) {
  return this.find({ salonId: salonId, status: status });
};

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);