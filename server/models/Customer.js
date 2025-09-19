const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    notes: { type: String }, // For special preferences or allergies
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Ensures a phone number is unique PER SALON
CustomerSchema.index({ salonId: 1, phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('Customer', CustomerSchema);