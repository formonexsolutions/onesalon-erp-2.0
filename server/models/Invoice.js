const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    
    // Supplier information
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    
    // Related Purchase Order
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder'
    },
    
    // Salon information
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Products received
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productBarcode: { type: String },
      productName: { type: String, required: true },
      expiryDate: { type: Date },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      receivedQuantity: { type: Number }, // Actual quantity received
      acceptedQuantity: { type: Number } // Quantity accepted into inventory
    }],
    
    // Financial details
    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    // Payment details
    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank-transfer', 'credit', 'upi'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid'],
      default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    
    // Status
    status: {
      type: String,
      enum: ['received', 'verified', 'accepted', 'rejected', 'partially-accepted'],
      default: 'received'
    },
    
    // Verification details
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    verifiedAt: { type: Date },
    discrepancies: [{ type: String }], // List of issues found
    
    // Notes
    notes: { type: String },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);