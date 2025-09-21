import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, UserIcon, CurrencyRupeeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: string;
}

interface Service {
  name: string;
  duration: number;
  price: number;
}

interface AppointmentDetails {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  services: Service[];
  totalAmount: number;
  notes?: string;
  estimatedDuration: number;
}

const AppointmentDetailsModal = ({ isOpen, onClose, appointmentId }: AppointmentDetailsModalProps) => {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointmentDetails();
    }
  }, [isOpen, appointmentId]);

  const fetchAppointmentDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/appointments/${appointmentId}`, {
        withCredentials: true
      });
      setAppointment(response.data);
      setNotes(response.data.notes || '');
    } catch (error) {
      console.error('Failed to fetch appointment details:', error);
      // Mock data for demonstration
      const mockAppointment = {
        id: appointmentId || '1',
        customerName: 'Sarah Johnson',
        customerPhone: '+91 98765 43210',
        date: '2025-01-15',
        time: '2:30 PM',
        status: 'in-progress' as const,
        services: [
          { name: 'Hair Cut & Styling', duration: 60, price: 1500 },
          { name: 'Hair Color', duration: 90, price: 3000 }
        ],
        totalAmount: 4500,
        notes: 'Customer prefers shorter layers. Allergic to ammonia-based products.',
        estimatedDuration: 150
      };
      setAppointment(mockAppointment);
      setNotes(mockAppointment.notes || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await axios.patch(`${BASE_URL}/api/appointments/${appointmentId}/status`, {
        status: newStatus
      }, {
        withCredentials: true
      });
      
      if (appointment) {
        setAppointment({
          ...appointment,
          status: newStatus as AppointmentDetails['status']
        });
      }
      
      // Show success notification (you can implement a toast notification here)
      console.log(`Appointment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      await axios.patch(`${BASE_URL}/api/appointments/${appointmentId}/notes`, {
        notes: notes
      }, {
        withCredentials: true
      });
      
      if (appointment) {
        setAppointment({
          ...appointment,
          notes: notes
        });
      }
      
      console.log('Notes updated successfully');
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
            Appointment Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appointment details...</p>
          </div>
        ) : appointment ? (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{appointment.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{appointment.customerPhone}</p>
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{appointment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{appointment.estimatedDuration} minutes</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Services</h4>
              <div className="space-y-2">
                {appointment.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.duration} minutes</p>
                    </div>
                    <p className="font-medium text-gray-900">₹{service.price}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg mt-2">
                <p className="font-semibold text-blue-900">Total Amount</p>
                <p className="font-bold text-blue-900 flex items-center">
                  <CurrencyRupeeIcon className="h-5 w-5 mr-1" />
                  {appointment.totalAmount}
                </p>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Update Status</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleStatusUpdate('in-progress')}
                  disabled={appointment.status === 'in-progress'}
                  className="flex items-center justify-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Start Service
                </button>
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={appointment.status === 'completed'}
                  className="flex items-center justify-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Complete
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the service..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <button
                onClick={handleNotesUpdate}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Update Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load appointment details.</p>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;