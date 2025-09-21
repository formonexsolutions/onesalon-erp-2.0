const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    // Basic Information
    appointmentId: { 
      type: String, 
      unique: true,
      required: true
    },
    
    // Customer and Staff
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    primaryStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    
    // Services
    services: [{
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
      },
      stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
      },
      price: { type: Number, required: true },
      duration: { type: Number, required: true },
      addons: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        duration: { type: Number, default: 0 }
      }],
      notes: { type: String }
    }],
    
    // Additional services (added during appointment)
    additionalServices: [{
      serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      },
      serviceName: { type: String },
      price: { type: Number },
      stylistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
      },
      duration: { type: Number }
    }],
    
    // Timing
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true }, // Format: "10:30 AM"
    startTime: { type: String }, // 24-hour format: "10:30"
    endTime: { type: String }, // 24-hour format: "11:30"
    estimatedDuration: { type: Number }, // Total duration in minutes
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    
    // Status Management
    status: {
      type: String,
      enum: [
        'scheduled', 'confirmed', 'checked_in', 'in_progress', 
        'completed', 'cancelled', 'no_show', 'rescheduled'
      ],
      default: 'scheduled'
    },
    
    // Booking Information
    appointmentType: {
      type: String,
      enum: ['scheduled', 'walkin'],
      required: true
    },
    bookingMethod: {
      type: String,
      enum: ['online', 'phone', 'walk_in', 'staff_booking'],
      default: 'online'
    },
    bookingSource: { type: String },
    
    // Customer Information
    customerNotes: { type: String },
    staffNotes: { type: String },
    internalNotes: { type: String },
    
    // Pricing
    subtotal: { type: Number, default: 0 },
    discount: { 
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      reason: { type: String },
      appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
    },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    
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
    advancePayment: { type: Number, default: 0 },
    
    // Reminders and Notifications
    remindersSent: [{
      type: { 
        type: String, 
        enum: ['sms', 'email', 'whatsapp', 'push'] 
      },
      sentAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ['sent', 'delivered', 'failed'] 
      }
    }],
    
    // Cancellation/Rescheduling
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: { 
      type: String, 
      enum: ['customer', 'staff', 'salon', 'system'] 
    },
    rescheduleHistory: [{
      originalDate: { type: Date },
      originalTime: { type: String },
      newDate: { type: Date },
      newTime: { type: String },
      reason: { type: String },
      rescheduledAt: { type: Date, default: Date.now },
      rescheduledBy: { 
        type: String, 
        enum: ['customer', 'staff', 'salon'] 
      }
    }],
    
    // Feedback and Rating
    customerRating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    customerFeedback: { type: String },
    
    // Special Flags
    isVip: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: { 
        type: String, 
        enum: ['weekly', 'bi_weekly', 'monthly', 'custom'] 
      },
      interval: { type: Number },
      endDate: { type: Date }
    },
    
    // Wait List
    isWaitListed: { type: Boolean, default: false },
    waitListPosition: { type: Number },
    
    // Digital Integration
    onlineBookingId: { type: String },
    googleCalendarEventId: { type: String },
    
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
AppointmentSchema.index({ salonId: 1, appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ salonId: 1, primaryStaff: 1, appointmentDate: 1 });
AppointmentSchema.index({ salonId: 1, customerId: 1, appointmentDate: -1 });
AppointmentSchema.index({ salonId: 1, status: 1, appointmentDate: 1 });

// Pre-save middleware to generate appointment ID
AppointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointmentId) {
    const count = await mongoose.model('Appointment').countDocuments();
    this.appointmentId = `APT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate totals and times
AppointmentSchema.pre('save', function(next) {
  // Calculate subtotal from services and additional services
  let subtotal = 0;
  let totalDuration = 0;
  
  // Calculate from main services
  if (this.services && this.services.length > 0) {
    this.services.forEach(service => {
      subtotal += service.price;
      totalDuration += service.duration;
      
      if (service.addons && service.addons.length > 0) {
        service.addons.forEach(addon => {
          subtotal += addon.price;
          totalDuration += addon.duration;
        });
      }
    });
  }
  
  // Calculate from additional services
  if (this.additionalServices && this.additionalServices.length > 0) {
    this.additionalServices.forEach(service => {
      subtotal += service.price || 0;
      totalDuration += service.duration || 0;
    });
  }
  
  this.subtotal = subtotal;
  this.estimatedDuration = totalDuration;
  
  // Apply discount
  let discountAmount = 0;
  if (this.discount.percentage > 0) {
    discountAmount = (this.subtotal * this.discount.percentage) / 100;
  } else if (this.discount.amount > 0) {
    discountAmount = this.discount.amount;
  }
  
  // Calculate total
  this.totalAmount = this.subtotal - discountAmount + (this.tax || 0);
  
  // Convert appointmentTime to 24-hour format for startTime if not set
  if (this.appointmentTime && !this.startTime) {
    this.startTime = this.convertTo24Hour(this.appointmentTime);
  }
  
  // Calculate endTime if not set
  if (this.startTime && this.estimatedDuration && !this.endTime) {
    this.endTime = this.calculateEndTime(this.startTime, this.estimatedDuration);
  }
  
  next();
});

// Helper method to convert 12-hour to 24-hour format
AppointmentSchema.methods.convertTo24Hour = function(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Helper method to calculate end time
AppointmentSchema.methods.calculateEndTime = function(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

// Virtual for time slot display
AppointmentSchema.virtual('timeSlot').get(function() {
  if (this.startTime && this.endTime) {
    return `${this.startTime} - ${this.endTime}`;
  }
  return this.appointmentTime;
});

// Method to check if appointment can be cancelled
AppointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.startTime || '00:00'}`);
  const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return hoursDifference >= 2 && ['scheduled', 'confirmed'].includes(this.status);
};

// Method to check if appointment can be rescheduled
AppointmentSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.startTime || '00:00'}`);
  const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return hoursDifference >= 4 && ['scheduled', 'confirmed'].includes(this.status);
};

// Static method to find conflicting appointments
AppointmentSchema.statics.findConflicts = function(staffId, date, startTime, endTime, excludeId = null) {
  const query = {
    $or: [
      { primaryStaff: staffId },
      { 'services.stylistId': staffId }
    ],
    appointmentDate: date,
    status: { $in: ['scheduled', 'confirmed', 'checked_in', 'in_progress'] },
    $and: [
      { startTime: { $lt: endTime } },
      { endTime: { $gt: startTime } }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Appointment', AppointmentSchema);