const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true },
    description: { type: String },
    category: { 
      type: String, 
      required: true,
      enum: [
        'haircut', 'hair_styling', 'hair_coloring', 'hair_treatment',
        'facial', 'skincare', 'massage', 'manicure', 'pedicure',
        'threading', 'waxing', 'eyebrow', 'makeup', 'bridal',
        'spa', 'wellness', 'consultation', 'other'
      ]
    },
    
    // Gender category (keeping for compatibility)
    genderCategory: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      default: 'unisex'
    },
    
    // Pricing
    price: { type: Number, required: true, min: 0 },
    priceRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    
    // Time and Duration
    duration: { type: Number, required: true, min: 15 }, // in minutes
    bufferTime: { type: Number, default: 15 }, // cleanup/setup time in minutes
    
    // Service Availability
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isOnlineBookable: { type: Boolean, default: true },
    
    // Skill Requirements
    requiredSkillLevel: {
      type: String,
      enum: ['junior', 'senior', 'expert', 'master'],
      default: 'junior'
    },
    
    // Staff Restrictions
    availableForStaff: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }], // If empty, available for all staff
    
    // Booking Rules
    advanceBookingDays: { type: Number, default: 30 }, // max days in advance
    minAdvanceHours: { type: Number, default: 2 }, // minimum hours in advance
    maxBookingsPerDay: { type: Number }, // limit per day (optional)
    
    // Add-ons and Extras
    availableAddons: [{
      name: { type: String, required: true },
      price: { type: Number, required: true },
      duration: { type: Number, default: 0 } // additional time
    }],
    
    // Images and Media
    images: [{ type: String }], // URLs to service images
    
    // Analytics
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    
    // Seasonal/Special Pricing
    seasonalPricing: [{
      startDate: { type: Date },
      endDate: { type: Date },
      priceModifier: { type: Number }, // percentage change
      reason: { type: String } // holiday, season, etc.
    }],
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ServiceSchema.index({ salonId: 1, category: 1 });
ServiceSchema.index({ salonId: 1, isActive: 1, isOnlineBookable: 1 });
ServiceSchema.index({ salonId: 1, isPopular: 1 });

// Validate price range
ServiceSchema.pre('save', function(next) {
  if (this.priceRange && this.priceRange.min && this.priceRange.max) {
    if (this.priceRange.min > this.priceRange.max) {
      return next(new Error('Minimum price cannot be greater than maximum price'));
    }
  }
  next();
});

// Virtual for total duration including buffer
ServiceSchema.virtual('totalDuration').get(function() {
  return this.duration + this.bufferTime;
});

// Method to check if service is available for a staff member
ServiceSchema.methods.isAvailableForStaff = function(staffId) {
  if (!this.availableForStaff || this.availableForStaff.length === 0) {
    return true; // Available for all staff
  }
  return this.availableForStaff.includes(staffId);
};

// Method to get current price (considering seasonal pricing)
ServiceSchema.methods.getCurrentPrice = function() {
  const now = new Date();
  const activeSeasonal = this.seasonalPricing?.find(season => 
    season.startDate <= now && season.endDate >= now
  );
  
  if (activeSeasonal) {
    return this.price * (1 + activeSeasonal.priceModifier / 100);
  }
  
  return this.price;
};

module.exports = mongoose.model('Service', ServiceSchema);