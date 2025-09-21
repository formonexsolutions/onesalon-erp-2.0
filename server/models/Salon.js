const mongoose = require('mongoose');

const SalonSchema = new mongoose.Schema(
  {
    salonName: { type: String, required: true },
    adminName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    gst: { type: String },
    state: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    address: { type: String, required: true },
    pincode: { type: String },
    timingsFrom: { type: String, required: true },
    timingsTo: { type: String, required: true },
    numberOfChairs: { type: Number, required: true },
    holidays: [{ type: String }], // Array of day names like ['Sunday', 'Monday']
    aboutBranch: { type: String },
    
    // KYC Documents
    documents: {
      panCard: { type: String }, // File path or URL
      aadhaarCard: { type: String }, // File path or URL
      gstCertificate: { type: String }, // File path or URL
      other: [{ name: String, path: String }] // Additional documents
    },
    
    // Approval workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'hold'],
      default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    declineReason: { type: String },
    
    // Business details
    isActive: { type: Boolean, default: true },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Salon', SalonSchema);