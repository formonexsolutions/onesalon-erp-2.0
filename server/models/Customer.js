const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    
    // Demographics
    dateOfBirth: { type: Date },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer_not_to_say'] 
    },
    anniversary: { type: Date },
    occupation: { type: String },
    
    // Customer type
    customerType: {
      type: String,
      enum: ['appointment', 'walkin'],
      default: 'appointment'
    },
    
    // Customer Tier/Loyalty Level
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'vip'],
      default: 'bronze'
    },
    loyaltyPoints: { type: Number, default: 0 },
    
    // Customer Preferences
    preferredServices: [{ type: String }],
    skinType: { 
      type: String, 
      enum: ['oily', 'dry', 'combination', 'sensitive', 'normal'] 
    },
    hairType: { 
      type: String, 
      enum: ['straight', 'wavy', 'curly', 'coily'] 
    },
    allergies: [{ type: String }],
    specialInstructions: { type: String },
    
    // Communication Preferences
    communicationPreferences: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      promotionalMessages: { type: Boolean, default: true }
    },
    
    // Referral System
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Customer' 
    },
    referralCount: { type: Number, default: 0 },
    
    // Enhanced Analytics
    averageSpent: { type: Number, default: 0 },
    nextVisit: { type: Date },
    customerLifetimeValue: { type: Number, default: 0 },
    
    // Salon association
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    
    // Visit history
    totalVisits: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date },
    
    // Status Management
    isActive: { type: Boolean, default: true },
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },
    
    // Preferences
    preferredStylists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    }],
    
    // Additional details
    notes: { type: String }, // For special preferences or allergies
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Ensures a phone number is unique PER SALON
CustomerSchema.index({ salonId: 1, phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model('Customer', CustomerSchema);