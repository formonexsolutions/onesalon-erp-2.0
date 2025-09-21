const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    
    // References
    billId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Bill', 
      required: true 
    },
    customerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Customer', 
      required: true 
    },
    salonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Salon', 
      required: true 
    },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Branch' 
    },
    
    // Payment Details
    amount: { type: Number, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'dd'], 
      required: true 
    },
    paymentDate: { type: Date, required: true, default: Date.now },
    
    // Payment Method Specific Details
    cardDetails: {
      cardType: { type: String, enum: ['credit', 'debit'] },
      last4Digits: { type: String },
      bank: { type: String },
      transactionId: { type: String }
    },
    upiDetails: {
      upiId: { type: String },
      transactionId: { type: String },
      appName: { type: String }
    },
    netbankingDetails: {
      bank: { type: String },
      transactionId: { type: String }
    },
    chequeDetails: {
      chequeNumber: { type: String },
      bank: { type: String },
      chequeDate: { type: Date },
      clearanceDate: { type: Date },
      status: { type: String, enum: ['pending', 'cleared', 'bounced'], default: 'pending' }
    },
    
    // Status and Verification
    status: { 
      type: String, 
      enum: ['pending', 'verified', 'failed', 'refunded'], 
      default: 'pending' 
    },
    verificationDate: { type: Date },
    failureReason: { type: String },
    
    // Refund Information
    refundAmount: { type: Number, default: 0 },
    refundDate: { type: Date },
    refundReason: { type: String },
    refundReference: { type: String },
    
    // Additional Information
    receivedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff', 
      required: true 
    },
    notes: { type: String },
    receiptNumber: { type: String },
    
    // Audit Fields
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff', 
      required: true 
    },
    modifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
  },
  { timestamps: true }
);

// Indexes for performance
PaymentSchema.index({ salonId: 1, paymentDate: -1 });
PaymentSchema.index({ billId: 1 });
PaymentSchema.index({ status: 1, paymentDate: 1 });
PaymentSchema.index({ paymentMethod: 1, paymentDate: -1 });

// Generate payment number before saving
PaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.paymentNumber) {
    const count = await mongoose.models.Payment.countDocuments({ 
      salonId: this.salonId 
    });
    this.paymentNumber = `PAY-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for formatted payment number
PaymentSchema.virtual('formattedPaymentNumber').get(function() {
  return `#${this.paymentNumber}`;
});

module.exports = mongoose.model('Payment', PaymentSchema);