const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema(
  {
    branchName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
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

module.exports = mongoose.model('Branch', BranchSchema);