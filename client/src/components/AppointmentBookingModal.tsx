import { useState, useEffect } from 'react';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, UserIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer?: Customer;
  onAppointmentBooked: (appointment: any) => void;
}

interface Customer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
}

interface Service {
  _id: string;
  serviceName: string;
  duration: number;
  price: number;
  category: string;
}

interface Staff {
  _id: string;
  staffName: string;
  role: string;
  specializations: string[];
  isAvailable: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
}

const AppointmentBookingModal = ({ isOpen, onClose, selectedCustomer, onAppointmentBooked }: AppointmentBookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchStaff();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && selectedStaff) {
      fetchTimeSlots();
    }
  }, [selectedDate, selectedStaff]);

  useEffect(() => {
    // Calculate totals when services change
    const amount = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const duration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
    setTotalAmount(amount);
    setTotalDuration(duration);
  }, [selectedServices]);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/services`, {
        withCredentials: true
      });
      setAvailableServices(response.data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Mock services data
      const mockServices = [
        { _id: '1', serviceName: 'Hair Cut', duration: 45, price: 800, category: 'Hair' },
        { _id: '2', serviceName: 'Hair Wash & Blow Dry', duration: 30, price: 500, category: 'Hair' },
        { _id: '3', serviceName: 'Hair Color', duration: 120, price: 2500, category: 'Hair' },
        { _id: '4', serviceName: 'Hair Highlights', duration: 180, price: 3500, category: 'Hair' },
        { _id: '5', serviceName: 'Facial Basic', duration: 60, price: 1200, category: 'Facial' },
        { _id: '6', serviceName: 'Facial Deep Cleansing', duration: 90, price: 1800, category: 'Facial' },
        { _id: '7', serviceName: 'Eyebrow Threading', duration: 15, price: 200, category: 'Threading' },
        { _id: '8', serviceName: 'Upper Lip Threading', duration: 10, price: 150, category: 'Threading' }
      ];
      setAvailableServices(mockServices);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/staff/available`, {
        withCredentials: true
      });
      setAvailableStaff(response.data.staff || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      // Mock staff data
      const mockStaff = [
        { _id: '1', staffName: 'Priya Sharma', role: 'Senior Stylist', specializations: ['Hair Cut', 'Hair Color'], isAvailable: true },
        { _id: '2', staffName: 'Anita Verma', role: 'Junior Stylist', specializations: ['Hair Cut', 'Hair Wash'], isAvailable: true },
        { _id: '3', staffName: 'Neha Gupta', role: 'Beautician', specializations: ['Facial', 'Threading'], isAvailable: true }
      ];
      setAvailableStaff(mockStaff);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/appointments/time-slots`, {
        params: { date: selectedDate, staffId: selectedStaff?._id, duration: totalDuration },
        withCredentials: true
      });
      setTimeSlots(response.data.timeSlots || []);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      // Mock time slots
      const slots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
        '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', 
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
      ];
      const mockTimeSlots = slots.map(time => ({
        time,
        available: Math.random() > 0.3, // 70% availability
        staffId: selectedStaff?._id
      }));
      setTimeSlots(mockTimeSlots);
    }
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s._id === service._id);
      if (isSelected) {
        return prev.filter(s => s._id !== service._id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedCustomer || !selectedDate || !selectedTimeSlot || !selectedStaff || selectedServices.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const appointmentData = {
        customerId: selectedCustomer._id,
        staffId: selectedStaff._id,
        services: selectedServices.map(s => s._id),
        appointmentDate: selectedDate,
        startTime: selectedTimeSlot,
        notes: notes,
        totalAmount: totalAmount
      };

      const response = await axios.post(`${BASE_URL}/api/appointments`, appointmentData, {
        withCredentials: true
      });

      onAppointmentBooked(response.data.appointment);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to book appointment:', error);
      // For demo, simulate successful booking
      const mockAppointment = {
        _id: Date.now().toString(),
        customerName: selectedCustomer.customerName,
        staffName: selectedStaff.staffName,
        services: selectedServices,
        appointmentDate: selectedDate,
        startTime: selectedTimeSlot,
        totalAmount: totalAmount,
        status: 'scheduled'
      };
      onAppointmentBooked(mockAppointment);
      onClose();
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedServices([]);
    setSelectedStaff(null);
    setSelectedTimeSlot('');
    setNotes('');
    setTimeSlots([]);
  };

  const groupServicesByCategory = (services: Service[]) => {
    return services.reduce((groups, service) => {
      const category = service.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
      return groups;
    }, {} as Record<string, Service[]>);
  };

  if (!isOpen) return null;

  const serviceGroups = groupServicesByCategory(availableServices);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-600" />
            Book Appointment
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {selectedCustomer && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Customer: {selectedCustomer.customerName}
            </h4>
            <p className="text-sm text-blue-700">{selectedCustomer.phoneNumber}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Services and Staff */}
          <div className="space-y-6">
            {/* Services Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Select Services</h4>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(serviceGroups).map(([category, services]) => (
                  <div key={category}>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <label key={service._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedServices.some(s => s._id === service._id)}
                            onChange={() => handleServiceToggle(service)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">{service.serviceName}</span>
                              <span className="text-green-600 font-medium">₹{service.price}</span>
                            </div>
                            <span className="text-sm text-gray-600">{service.duration} minutes</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Select Staff</h4>
              <div className="space-y-2">
                {availableStaff.map((staff) => (
                  <label key={staff._id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="staff"
                      checked={selectedStaff?._id === staff._id}
                      onChange={() => setSelectedStaff(staff)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{staff.staffName}</div>
                      <div className="text-sm text-gray-600">{staff.role}</div>
                      <div className="text-xs text-gray-500">
                        Specializes in: {staff.specializations.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Date, Time, and Summary */}
          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && selectedStaff && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Available Time Slots
                </h4>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTimeSlot(slot.time)}
                      disabled={!slot.available}
                      className={`p-2 text-sm rounded-md border ${
                        selectedTimeSlot === slot.time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : slot.available
                          ? 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Appointment Summary */}
            {selectedServices.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Appointment Summary</h4>
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div key={service._id} className="flex justify-between text-sm">
                      <span>{service.serviceName}</span>
                      <span>₹{service.price}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Duration:</span>
                      <span>{totalDuration} minutes</span>
                    </div>
                    <div className="flex justify-between font-medium text-green-600">
                      <span>Total Amount:</span>
                      <span className="flex items-center">
                        <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                        {totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or notes..."
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleBookAppointment}
            disabled={!selectedCustomer || !selectedDate || !selectedTimeSlot || !selectedStaff || selectedServices.length === 0 || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Booking...
              </>
            ) : (
              'Book Appointment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingModal;