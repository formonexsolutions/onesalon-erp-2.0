import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../redux/authSlice';
import axios from 'axios';
import RoleBasedLayout from '../components/layouts/RoleBasedLayout';
import CustomerSearchModal from '../components/CustomerSearchModal';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import PaymentProcessingModal from '../components/PaymentProcessingModal';
import { 
  CalendarDaysIcon, 
  UserPlusIcon, 
  CurrencyDollarIcon, 
  PhoneIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Customer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  lastVisit?: string;
  totalVisits?: number;
  totalSpent?: number;
}

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
  stylistName?: string;
}

interface DashboardStats {
  todayAppointments: number;
  walkInCustomers: number;
  dailyRevenue: number;
  pendingCheckouts: number;
}

const ReceptionistDashboard = () => {
  const { user } = useSelector(selectAuth);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    walkInCustomers: 0,
    dailyRevenue: 0,
    pendingCheckouts: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isCustomerSearchModalOpen, setIsCustomerSearchModalOpen] = useState(false);
  const [isAppointmentBookingModalOpen, setIsAppointmentBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<any>(null);

  useEffect(() => {
    fetchReceptionistData();
  }, []);

  const fetchReceptionistData = async () => {
    try {
      setIsLoading(true);
      // Fetch today's appointments
      const appointmentsResponse = await axios.get(`${BASE_URL}/api/appointments/today`, {
        withCredentials: true
      });
      setTodayAppointments(appointmentsResponse.data);

      // Fetch recent customers
      const customersResponse = await axios.get(`${BASE_URL}/api/customers/recent`, {
        withCredentials: true
      });
      setCustomers(customersResponse.data);

      // Fetch dashboard stats
      const statsResponse = await axios.get(`${BASE_URL}/api/reception/dashboard-stats`, {
        withCredentials: true
      });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch receptionist data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkInCustomer = async (appointmentId: string) => {
    try {
      await axios.put(`${BASE_URL}/api/appointments/${appointmentId}/check-in`, {}, {
        withCredentials: true
      });
      fetchReceptionistData(); // Refresh data
    } catch (error) {
      console.error('Failed to check in customer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Modal handlers
  const handleNewAppointment = () => {
    setSelectedCustomer(null);
    setIsCustomerSearchModalOpen(true);
  };

  const handleCustomerSelected = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAppointmentBookingModalOpen(true);
  };

  const handleAppointmentBooked = (appointment: any) => {
    console.log('Appointment booked:', appointment);
    fetchReceptionistData(); // Refresh data
  };

  const handleProcessPayment = (appointment: any) => {
    setSelectedAppointmentForPayment({
      appointmentId: appointment._id,
      customerName: appointment.customerName,
      services: appointment.services,
      totalAmount: appointment.totalAmount
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = (payment: any) => {
    console.log('Payment completed:', payment);
    fetchReceptionistData(); // Refresh data
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phoneNumber.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reception dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleBasedLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome, {user?.name}! Manage appointments and customer service</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
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
                <UserPlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Walk-in Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.walkInCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.dailyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Checkouts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingCheckouts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={handleNewAppointment}
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center justify-center mb-2">
              <PlusIcon className="h-8 w-8" />
            </div>
            <h3 className="font-semibold">Book Appointment</h3>
            <p className="text-sm opacity-90">Schedule new appointment</p>
          </button>

          <button 
            onClick={() => setIsCustomerSearchModalOpen(true)}
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors"
          >
            <div className="flex items-center justify-center mb-2">
              <UserPlusIcon className="h-8 w-8" />
            </div>
            <h3 className="font-semibold">Add Customer</h3>
            <p className="text-sm opacity-90">Register new customer</p>
          </button>

          <button className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors">
            <div className="flex items-center justify-center mb-2">
              <CurrencyDollarIcon className="h-8 w-8" />
            </div>
            <h3 className="font-semibold">Process Payment</h3>
            <p className="text-sm opacity-90">Handle billing</p>
          </button>
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
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.customerName}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {appointment.phoneNumber}
                          </p>
                          {appointment.stylistName && (
                            <p className="text-sm text-gray-600">Stylist: {appointment.stylistName}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <p className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                        <p>Services: {appointment.services.map(s => s.serviceName).join(', ')}</p>
                        <p className="font-medium text-gray-900">Total: ₹{appointment.totalAmount}</p>
                      </div>
                      <div className="flex space-x-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => checkInCustomer(appointment._id)}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Check In
                          </button>
                        )}
                        {appointment.status === 'completed' && (
                          <button
                            onClick={() => handleProcessPayment(appointment)}
                            className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-md text-sm hover:bg-purple-200"
                          >
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            Process Payment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Search & Management */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customer Management</h2>
            </div>
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Customer List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    {searchQuery ? 'No customers found' : 'No recent customers'}
                  </p>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div key={customer._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <h4 className="font-medium text-gray-900">{customer.customerName}</h4>
                        <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                        {customer.lastVisit && (
                          <p className="text-xs text-gray-500">Last visit: {new Date(customer.lastVisit).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200">
                          Book
                        </button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200">
                          View
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{todayAppointments.filter(a => a.status === 'completed').length}</p>
              <p className="text-sm text-gray-600">Completed Services</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ₹{todayAppointments
                  .filter(a => a.status === 'completed')
                  .reduce((sum, a) => sum + a.totalAmount, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Revenue Generated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}
              </p>
              <p className="text-sm text-gray-600">Pending Appointments</p>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Modals */}
      <CustomerSearchModal 
        isOpen={isCustomerSearchModalOpen}
        onClose={() => setIsCustomerSearchModalOpen(false)}
        onCustomerSelect={handleCustomerSelected}
      />
      
      <AppointmentBookingModal 
        isOpen={isAppointmentBookingModalOpen}
        onClose={() => setIsAppointmentBookingModalOpen(false)}
        selectedCustomer={selectedCustomer || undefined}
        onAppointmentBooked={handleAppointmentBooked}
      />
      
      {selectedAppointmentForPayment && (
        <PaymentProcessingModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          appointmentData={selectedAppointmentForPayment}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </RoleBasedLayout>
  );
};

export default ReceptionistDashboard;