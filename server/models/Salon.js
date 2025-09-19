const mongoose = require('mongoose');

const SalonSchema = new mongoose.Schema(
  {
    salonName: { type: String, required: true },
    gst: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  // ✅ Enable automatic timestamps
  { timestamps: true }
);

module.exports = mongoose.model('Salon', SalonSchema);