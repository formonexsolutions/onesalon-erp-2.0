const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema(
  {
    billNumber: { type: String, unique: true }, // Auto-generated
    billDate: { type: Date, default: Date.now },
    
    // Customer information
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    
    // Appointment reference
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    
    // Services provided
    services: [{
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
      },
      serviceName: { type: String, required: true },
      stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      stylistName: { type: String, required: true },
      price: { type: Number, required: true },
      duration: { type: Number }
    }],
    
    // Products sold
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true }
    }],
    
    // Financial calculations
    serviceSubtotal: { type: Number, default: 0 },
    productSubtotal: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    
    // Discounts
    serviceDiscount: { type: Number, default: 0 },
    productDiscount: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    
    // Taxes
    serviceTax: { type: Number, default: 0 },
    productTax: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    
    // Final amount
    totalAmount: { type: Number, required: true },
    
    // Payment details
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'bank-transfer'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'refunded'],
      default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Receipt sharing
    receiptSent: {
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    
    // Notes
    notes: { type: String },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Generate bill number before saving
BillSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `BILL${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', BillSchema);