const mongoose = require('mongoose');

const FinancialSummarySchema = new mongoose.Schema(
  {
    // Time Period
    date: { type: Date, required: true },
    period: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], 
      required: true 
    },
    
    // Revenue Breakdown
    revenue: {
      services: { type: Number, default: 0 },
      products: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Payment Method Breakdown
    paymentMethods: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      upi: { type: Number, default: 0 },
      netbanking: { type: Number, default: 0 },
      wallet: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    
    // Expense Breakdown
    expenses: {
      rent: { type: Number, default: 0 },
      utilities: { type: Number, default: 0 },
      supplies: { type: Number, default: 0 },
      equipment: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      staff_salary: { type: Number, default: 0 },
      staff_incentive: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      license_fees: { type: Number, default: 0 },
      training: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      miscellaneous: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Tax Information
    taxes: {
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Discounts Given
    discounts: {
      service: { type: Number, default: 0 },
      product: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    
    // Key Metrics
    metrics: {
      grossProfit: { type: Number, default: 0 }, // Revenue - Direct Costs
      netProfit: { type: Number, default: 0 }, // Gross Profit - All Expenses
      profitMargin: { type: Number, default: 0 }, // (Net Profit / Revenue) * 100
      
      // Customer Metrics
      totalCustomers: { type: Number, default: 0 },
      newCustomers: { type: Number, default: 0 },
      returningCustomers: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      
      // Service Metrics
      totalAppointments: { type: Number, default: 0 },
      completedAppointments: { type: Number, default: 0 },
      cancelledAppointments: { type: Number, default: 0 },
      noShowAppointments: { type: Number, default: 0 },
      
      // Staff Metrics
      activeStaff: { type: Number, default: 0 },
      totalWorkingHours: { type: Number, default: 0 },
      averageServiceTime: { type: Number, default: 0 }
    },
    
    // Comparison with Previous Period
    comparison: {
      revenueGrowth: { type: Number, default: 0 }, // Percentage
      expenseGrowth: { type: Number, default: 0 }, // Percentage
      profitGrowth: { type: Number, default: 0 }, // Percentage
      customerGrowth: { type: Number, default: 0 } // Percentage
    },
    
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
    
    // Generation Information
    generatedBy: { 
      type: String, 
      enum: ['system', 'manual'], 
      default: 'system' 
    },
    generatedAt: { type: Date, default: Date.now },
    
    // Status
    status: { 
      type: String, 
      enum: ['draft', 'finalized'], 
      default: 'draft' 
    },
    
    // Audit Fields
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
    modifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
  },
  { timestamps: true }
);

// Indexes for performance
FinancialSummarySchema.index({ salonId: 1, period: 1, date: -1 });
FinancialSummarySchema.index({ date: -1, period: 1 });
FinancialSummarySchema.index({ status: 1, generatedAt: -1 });

// Ensure unique combination of salon, period, and date
FinancialSummarySchema.index({ 
  salonId: 1, 
  period: 1, 
  date: 1 
}, { unique: true });

module.exports = mongoose.model('FinancialSummary', FinancialSummarySchema);