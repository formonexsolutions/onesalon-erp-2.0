const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StaffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true }, // Auto-generated ID
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    email: { type: String },
    username: { type: String, unique: true },
    password: { type: String, required: true },
    
    role: {
      type: String,
      enum: ['salonadmin', 'branchadmin', 'stylist', 'receptionist', 'manager', 'clerk'],
      required: true,
    },
    
    // Personal Information
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    dateOfBirth: { type: Date },
    address: { type: String },
    
    // Documents
    documents: {
      panCard: { type: String },
      aadhaarCard: { type: String }
    },
    
    // Professional Information
    designation: { type: String },
    specialization: [{
      type: String,
      enum: ['Hair Dressing', 'Facial', 'Massage', 'Manicure', 'Pedicure', 'Hair Coloring', 'Hair Styling']
    }],
    
    // Salon/Branch Assignment
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false, 
    },
    
    // Status
    isActive: { type: Boolean, default: true },
    canReceiveAppointments: { type: Boolean, default: true },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Generate employee ID before saving
StaffSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Staff').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Staff', StaffSchema);