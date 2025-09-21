const mongoose = require('mongoose');

const StaffAvailabilitySchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true
    },
    
    // Date-specific availability
    date: { type: Date, required: true },
    
    // Available time slots
    timeSlots: [{
      startTime: { type: String, required: true }, // Format: "09:00"
      endTime: { type: String, required: true }, // Format: "18:00"
      isAvailable: { type: Boolean, default: true },
      unavailableReason: { 
        type: String,
        enum: ['break', 'lunch', 'meeting', 'training', 'personal', 'sick', 'vacation', 'other']
      },
      notes: { type: String }
    }],
    
    // Day-level availability
    isDayOff: { type: Boolean, default: false },
    dayOffReason: { 
      type: String,
      enum: ['weekly_off', 'vacation', 'sick_leave', 'personal_leave', 'public_holiday', 'other']
    },
    
    // Working hours for the day
    workingHours: {
      start: { type: String }, // Format: "09:00"
      end: { type: String }, // Format: "18:00"
      breakStart: { type: String }, // Format: "13:00"
      breakEnd: { type: String }, // Format: "14:00"
    },
    
    // Capacity management
    maxAppointments: { type: Number, default: null }, // null = unlimited
    maxConcurrentServices: { type: Number, default: 1 },
    
    // Skills and services available
    availableServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }], // If empty, all services available
    
    // Recurring pattern (for template schedules)
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly'] 
      },
      daysOfWeek: [{ 
        type: Number, 
        min: 0, 
        max: 6 
      }], // 0 = Sunday, 6 = Saturday
      endDate: { type: Date }
    },
    
    // Override settings
    isOverride: { type: Boolean, default: false }, // Overrides recurring schedule
    overrideReason: { type: String },
    
    // Emergency and special flags
    isEmergencyAvailable: { type: Boolean, default: false },
    acceptsWalkIns: { type: Boolean, default: true },
    acceptsOnlineBookings: { type: Boolean, default: true },
    
    // Location/Station
    workStation: { type: String }, // Chair/station number
    location: { 
      type: String,
      enum: ['main_floor', 'vip_section', 'spa_area', 'bridal_suite', 'outdoor', 'home_service']
    },
    
    // Salon association
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true
    },
    
    // --- Audit Fields ---
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true }
);

// Indexes for efficient queries
StaffAvailabilitySchema.index({ salon: 1, staff: 1, date: 1 }, { unique: true });
StaffAvailabilitySchema.index({ salon: 1, date: 1 });
StaffAvailabilitySchema.index({ staff: 1, date: 1 });
StaffAvailabilitySchema.index({ salon: 1, staff: 1, isRecurring: 1 });

// Virtual for total working hours
StaffAvailabilitySchema.virtual('totalWorkingHours').get(function() {
  if (!this.workingHours.start || !this.workingHours.end) return 0;
  
  const start = this.timeToMinutes(this.workingHours.start);
  const end = this.timeToMinutes(this.workingHours.end);
  let total = end - start;
  
  // Subtract break time
  if (this.workingHours.breakStart && this.workingHours.breakEnd) {
    const breakStart = this.timeToMinutes(this.workingHours.breakStart);
    const breakEnd = this.timeToMinutes(this.workingHours.breakEnd);
    total -= (breakEnd - breakStart);
  }
  
  return Math.round((total / 60) * 100) / 100; // Convert to hours with 2 decimal places
});

// Helper method to convert time string to minutes
StaffAvailabilitySchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Method to check if staff is available at a specific time
StaffAvailabilitySchema.methods.isAvailableAt = function(timeStr) {
  if (this.isDayOff) return false;
  
  const timeMinutes = this.timeToMinutes(timeStr);
  
  // Check if time is within working hours
  if (this.workingHours.start && this.workingHours.end) {
    const startMinutes = this.timeToMinutes(this.workingHours.start);
    const endMinutes = this.timeToMinutes(this.workingHours.end);
    
    if (timeMinutes < startMinutes || timeMinutes >= endMinutes) {
      return false;
    }
    
    // Check if time is during break
    if (this.workingHours.breakStart && this.workingHours.breakEnd) {
      const breakStartMinutes = this.timeToMinutes(this.workingHours.breakStart);
      const breakEndMinutes = this.timeToMinutes(this.workingHours.breakEnd);
      
      if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
        return false;
      }
    }
  }
  
  // Check specific time slots
  for (const slot of this.timeSlots) {
    const slotStartMinutes = this.timeToMinutes(slot.startTime);
    const slotEndMinutes = this.timeToMinutes(slot.endTime);
    
    if (timeMinutes >= slotStartMinutes && timeMinutes < slotEndMinutes) {
      return slot.isAvailable;
    }
  }
  
  return true; // Available if no specific restrictions
};

// Method to get available time slots for a duration
StaffAvailabilitySchema.methods.getAvailableSlots = function(durationMinutes, existingAppointments = []) {
  if (this.isDayOff) return [];
  
  const slots = [];
  const workStart = this.workingHours.start ? this.timeToMinutes(this.workingHours.start) : 540; // 9:00 AM
  const workEnd = this.workingHours.end ? this.timeToMinutes(this.workingHours.end) : 1080; // 6:00 PM
  
  // Create array of occupied time slots from existing appointments
  const occupiedSlots = existingAppointments.map(apt => ({
    start: this.timeToMinutes(apt.startTime),
    end: this.timeToMinutes(apt.endTime)
  }));
  
  // Add break time as occupied
  if (this.workingHours.breakStart && this.workingHours.breakEnd) {
    occupiedSlots.push({
      start: this.timeToMinutes(this.workingHours.breakStart),
      end: this.timeToMinutes(this.workingHours.breakEnd)
    });
  }
  
  // Add unavailable time slots
  this.timeSlots.forEach(slot => {
    if (!slot.isAvailable) {
      occupiedSlots.push({
        start: this.timeToMinutes(slot.startTime),
        end: this.timeToMinutes(slot.endTime)
      });
    }
  });
  
  // Sort occupied slots by start time
  occupiedSlots.sort((a, b) => a.start - b.start);
  
  // Find available slots
  let currentTime = workStart;
  
  for (const occupied of occupiedSlots) {
    // Check if there's enough time before this occupied slot
    if (occupied.start - currentTime >= durationMinutes) {
      // Find slots in this gap
      let slotStart = currentTime;
      while (slotStart + durationMinutes <= occupied.start) {
        slots.push({
          startTime: this.minutesToTime(slotStart),
          endTime: this.minutesToTime(slotStart + durationMinutes)
        });
        slotStart += 30; // 30-minute intervals
      }
    }
    currentTime = Math.max(currentTime, occupied.end);
  }
  
  // Check remaining time after last occupied slot
  if (workEnd - currentTime >= durationMinutes) {
    let slotStart = currentTime;
    while (slotStart + durationMinutes <= workEnd) {
      slots.push({
        startTime: this.minutesToTime(slotStart),
        endTime: this.minutesToTime(slotStart + durationMinutes)
      });
      slotStart += 30; // 30-minute intervals
    }
  }
  
  return slots;
};

// Helper method to convert minutes to time string
StaffAvailabilitySchema.methods.minutesToTime = function(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Static method to create recurring availability
StaffAvailabilitySchema.statics.createRecurringAvailability = async function(staffId, salonId, pattern, workingHours, startDate, endDate) {
  const availabilities = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (pattern.daysOfWeek.includes(current.getDay())) {
      const availability = new this({
        staff: staffId,
        salon: salonId,
        date: new Date(current),
        workingHours: workingHours,
        isRecurring: true,
        recurringPattern: pattern
      });
      
      availabilities.push(availability);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return await this.insertMany(availabilities, { ordered: false });
};

module.exports = mongoose.model('StaffAvailability', StaffAvailabilitySchema);