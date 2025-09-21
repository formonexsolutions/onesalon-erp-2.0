const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    expenseNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },
    
    // Basic Information
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    
    // Categorization
    category: { 
      type: String, 
      enum: [
        'rent', 'utilities', 'supplies', 'equipment', 'marketing', 
        'staff_salary', 'staff_incentive', 'maintenance', 'insurance', 
        'license_fees', 'training', 'travel', 'food', 'miscellaneous'
      ], 
      required: true 
    },
    subcategory: { type: String },
    
    // Payment Information
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'card', 'upi', 'netbanking', 'cheque', 'bank_transfer'], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'partial'], 
      default: 'paid' 
    },
    paidAmount: { type: Number, required: true },
    
    // Vendor/Supplier Information
    vendorName: { type: String },
    vendorPhone: { type: String },
    vendorEmail: { type: String },
    supplierId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Supplier' 
    },
    
    // Reference Information
    billNumber: { type: String },
    receiptNumber: { type: String },
    purchaseOrderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PurchaseOrder' 
    },
    
    // Tax Information
    taxAmount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    
    // Recurrence (for recurring expenses like rent)
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] 
    },
    nextRecurrenceDate: { type: Date },
    
    // Approval Workflow
    status: { 
      type: String, 
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'cancelled'], 
      default: 'approved' 
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
    approvedDate: { type: Date },
    rejectionReason: { type: String },
    
    // Attachments
    attachments: [{
      fileName: { type: String, required: true },
      filePath: { type: String, required: true },
      fileType: { type: String },
      uploadDate: { type: Date, default: Date.now }
    }],
    
    // Association
    salonId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Salon', 
      required: true 
    },
    branchId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Branch' 
    },
    
    // Staff Association (who incurred/reported the expense)
    reportedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff', 
      required: true 
    },
    
    // Additional Information
    notes: { type: String },
    tags: [{ type: String }], // For custom categorization
    
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
ExpenseSchema.index({ salonId: 1, expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });
ExpenseSchema.index({ status: 1, expenseDate: -1 });
ExpenseSchema.index({ isRecurring: 1, nextRecurrenceDate: 1 });

// Generate expense number before saving
ExpenseSchema.pre('save', async function(next) {
  if (this.isNew && !this.expenseNumber) {
    const count = await mongoose.models.Expense.countDocuments({ 
      salonId: this.salonId 
    });
    this.expenseNumber = `EXP-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for formatted expense number
ExpenseSchema.virtual('formattedExpenseNumber').get(function() {
  return `#${this.expenseNumber}`;
});

module.exports = mongoose.model('Expense', ExpenseSchema);