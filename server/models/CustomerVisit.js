const mongoose = require('mongoose');

const CustomerVisitSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true
    },
    
    // Visit Details
    visitDate: { type: Date, required: true, default: Date.now },
    visitType: {
      type: String,
      enum: ['appointment', 'walkin', 'emergency'],
      default: 'appointment'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled'
    },
    
    // Services
    services: [{
      serviceName: { type: String, required: true },
      serviceCategory: { type: String },
      duration: { type: Number }, // in minutes
      price: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      finalPrice: { type: Number, required: true },
      staff: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Staff' 
      }
    }],
    
    // Totals
    totalDuration: { type: Number }, // in minutes
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    
    // Payment Information
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'credit']
    },
    
    // Customer Experience
    waitTime: { type: Number }, // in minutes
    customerRating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    feedback: { type: String },
    
    // Staff Performance
    staffRating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    
    // Loyalty Points
    pointsEarned: { type: Number, default: 0 },
    pointsRedeemed: { type: Number, default: 0 },
    
    // Visit Notes
    notes: { type: String },
    
    // Products Used/Recommended
    productsUsed: [{
      productName: { type: String },
      quantity: { type: Number },
      cost: { type: Number }
    }],
    
    // Follow-up
    nextAppointmentRecommended: { type: Date },
    followUpRequired: { type: Boolean, default: false },
    followUpNotes: { type: String },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for efficient queries
CustomerVisitSchema.index({ customer: 1, visitDate: -1 });
CustomerVisitSchema.index({ salon: 1, visitDate: -1 });
CustomerVisitSchema.index({ status: 1, visitDate: 1 });

// Pre-save middleware to calculate totals
CustomerVisitSchema.pre('save', function(next) {
  if (this.services && this.services.length > 0) {
    this.subtotal = this.services.reduce((sum, service) => sum + service.price, 0);
    this.totalDiscount = this.services.reduce((sum, service) => sum + (service.discount || 0), 0);
    this.totalAmount = this.subtotal - this.totalDiscount + (this.tax || 0);
    this.totalDuration = this.services.reduce((sum, service) => sum + (service.duration || 0), 0);
    
    // Calculate final prices for services
    this.services.forEach(service => {
      service.finalPrice = service.price - (service.discount || 0);
    });
  }
  next();
});

module.exports = mongoose.model('CustomerVisit', CustomerVisitSchema);