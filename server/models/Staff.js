const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['salonadmin', 'branchadmin', 'stylist', 'receptionist'],
      required: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
     branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      // This is not required for the main salonadmin
      required: false, 
    },
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  // ✅ Enable automatic timestamps
  { timestamps: true }
);

// Hash password before saving staff
StaffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Staff', StaffSchema);