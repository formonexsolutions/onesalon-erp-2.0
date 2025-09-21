import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../redux/authSlice';
import axios from 'axios';
import RoleBasedLayout from '../components/layouts/RoleBasedLayout';
import AvailabilityModal from '../components/AvailabilityModal';
import CommissionReportModal from '../components/CommissionReportModal';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';
import { CalendarIcon, UserIcon, CurrencyDollarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Appointment {
  _id: string;
  appointmentId: string;
  customerName: string;
  phoneNumber: string;
  services: Array<{
    serviceName: string;
    duration: number;
    price: number;
  }>;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
}

interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  monthlyEarnings: number;
  completedServices: number;
}

const StylistDashboard = () => {
  const { user } = useSelector(selectAuth);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    monthlyEarnings: 0,
    completedServices: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');

  useEffect(() => {
    fetchStylistData();
  }, []);

  const fetchStylistData = async () => {
    try {
      setIsLoading(true);
      // Fetch appointments for today
      const todayResponse = await axios.get(`${BASE_URL}/api/appointments/stylist/today`, {
        withCredentials: true
      });
      setTodayAppointments(todayResponse.data);

      // Fetch upcoming appointments
      const upcomingResponse = await axios.get(`${BASE_URL}/api/appointments/stylist/upcoming`, {
        withCredentials: true
      });
      setUpcomingAppointments(upcomingResponse.data);

      // Fetch dashboard stats
      const statsResponse = await axios.get(`${BASE_URL}/api/staff/dashboard-stats`, {
        withCredentials: true
      });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch stylist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      await axios.put(`${BASE_URL}/api/appointments/${appointmentId}/status`, 
        { status },
        { withCredentials: true }
      );
      fetchStylistData(); // Refresh data
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewAppointment = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-gray-600">Here's your stylist dashboard for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.monthlyEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedServices}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
            </div>
            <div className="p-6">
              {todayAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No appointments scheduled for today</p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.customerName}</h3>
                          <p className="text-sm text-gray-600">{appointment.phoneNumber}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p>{appointment.startTime} - {appointment.endTime}</p>
                        <p>Services: {appointment.services.map(s => s.serviceName).join(', ')}</p>
                        <p className="font-medium">Total: ₹{appointment.totalAmount}</p>
                      </div>
                      <div className="flex space-x-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'in-progress')}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                          >
                            Start Service
                          </button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                            className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm hover:bg-purple-200"
                          >
                            Complete
                          </button>
                        )}
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleViewAppointment(appointment._id)}
                          className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            </div>
            <div className="p-6">
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map((appointment) => (
                    <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.customerName}</h3>
                          <p className="text-sm text-gray-600">{appointment.phoneNumber}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <p>{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}</p>
                        <p>Services: {appointment.services.map(s => s.serviceName).join(', ')}</p>
                        <p className="font-medium">Total: ₹{appointment.totalAmount}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewAppointment(appointment._id)}
                          className="flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => {/* Navigate to appointments page */}}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">View All Appointments</h3>
              <p className="text-sm text-gray-600 mt-1">See your complete schedule</p>
            </button>
            <button 
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">Update Availability</h3>
              <p className="text-sm text-gray-600 mt-1">Set your working hours</p>
            </button>
            <button 
              onClick={() => setIsCommissionModalOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <h3 className="font-medium text-gray-900">Commission Report</h3>
              <p className="text-sm text-gray-600 mt-1">View your earnings</p>
            </button>
          </div>
        </div>
        </div>
      </div>
      
      {/* Modals */}
      <AvailabilityModal 
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSave={(availability) => {
          console.log('Saving availability:', availability);
          setIsAvailabilityModalOpen(false);
          // TODO: Save availability to backend
        }}
      />
      
      <CommissionReportModal 
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
      />
      
      <AppointmentDetailsModal 
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentId={selectedAppointmentId}
      />
    </RoleBasedLayout>
  );
};

export default StylistDashboard;