const mongoose = require('mongoose');

const ProductConsumptionSchema = new mongoose.Schema(
  {
    // Product information
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productBarcode: { type: String },
    productName: { type: String, required: true },
    
    // Consumption details
    requestDate: { type: Date, default: Date.now },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    requestedByName: { type: String, required: true },
    
    quantity: { type: Number, required: true },
    reason: { type: String, required: true }, // Service use, wastage, etc.
    
    // Approval workflow
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'dispensed'],
      default: 'requested'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    approvedAt: { type: Date },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Notes
    notes: { type: String },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductConsumption', ProductConsumptionSchema);