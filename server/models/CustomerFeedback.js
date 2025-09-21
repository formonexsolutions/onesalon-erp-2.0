const mongoose = require('mongoose');

const CustomerFeedbackSchema = new mongoose.Schema(
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
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerVisit',
      required: true
    },
    
    // Overall Experience
    overallRating: { 
      type: Number, 
      required: true,
      min: 1, 
      max: 5 
    },
    
    // Detailed Ratings
    serviceQuality: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    staffBehavior: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    cleanliness: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    ambiance: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    valueForMoney: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    punctuality: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    
    // Specific Service Feedback
    serviceFeedback: [{
      serviceName: { type: String, required: true },
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      staff: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Staff' 
      },
      staffRating: { type: Number, min: 1, max: 5 }
    }],
    
    // Comments
    positiveComments: { type: String },
    negativeComments: { type: String },
    suggestions: { type: String },
    generalComments: { type: String },
    
    // Recommendation
    wouldRecommend: { type: Boolean },
    likelyToReturn: {
      type: String,
      enum: ['very_likely', 'likely', 'neutral', 'unlikely', 'very_unlikely']
    },
    
    // Feedback Method
    feedbackMethod: {
      type: String,
      enum: ['in_person', 'phone', 'email', 'sms', 'app', 'website', 'social_media'],
      default: 'in_person'
    },
    
    // Response Status
    responseRequired: { type: Boolean, default: false },
    responseProvided: { type: Boolean, default: false },
    responseDate: { type: Date },
    responseBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
    responseText: { type: String },
    
    // Follow-up Actions
    actionRequired: { type: Boolean, default: false },
    actionTaken: { type: String },
    actionBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Staff' 
    },
    actionDate: { type: Date },
    
    // Internal Notes
    internalNotes: { type: String },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded', 'resolved', 'escalated'],
      default: 'pending'
    },
    
    // Priority
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for efficient queries
CustomerFeedbackSchema.index({ customer: 1, createdAt: -1 });
CustomerFeedbackSchema.index({ salon: 1, overallRating: 1 });
CustomerFeedbackSchema.index({ status: 1, priority: 1 });
CustomerFeedbackSchema.index({ responseRequired: 1, responseProvided: 1 });

// Virtual for average rating calculation
CustomerFeedbackSchema.virtual('averageDetailedRating').get(function() {
  const ratings = [
    this.serviceQuality,
    this.staffBehavior,
    this.cleanliness,
    this.ambiance,
    this.valueForMoney,
    this.punctuality
  ].filter(rating => rating != null);
  
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

module.exports = mongoose.model('CustomerFeedback', CustomerFeedbackSchema);