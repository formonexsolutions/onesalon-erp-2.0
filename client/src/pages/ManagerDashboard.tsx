import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuth } from '../redux/authSlice';
import axios from 'axios';
import StaffManagementModal from '../components/StaffManagementModal';
import PerformanceReportModal from '../components/PerformanceReportModal';
import InventoryManagementModal from '../components/InventoryManagementModal';
import StaffSchedulingModal from '../components/StaffSchedulingModal';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ShoppingBagIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Staff {
  _id: string;
  name: string;
  role: string;
  performance: {
    totalServices: number;
    revenue: number;
    rating: number;
  };
  status: 'active' | 'inactive';
}

interface PerformanceMetrics {
  dailyRevenue: number;
  monthlyRevenue: number;
  activeStaff: number;
  totalAppointments: number;
  completionRate: number;
  averageServiceTime: number;
  customerSatisfaction: number;
  inventoryAlerts: number;
}

interface InventoryAlert {
  _id: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  alertType: 'low_stock' | 'out_of_stock';
}

const ManagerDashboard = () => {
  const { user } = useSelector(selectAuth);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dailyRevenue: 0,
    monthlyRevenue: 0,
    activeStaff: 0,
    totalAppointments: 0,
    completionRate: 0,
    averageServiceTime: 0,
    customerSatisfaction: 0,
    inventoryAlerts: 0
  });
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  
  // Modal states
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [isPerformanceReportOpen, setIsPerformanceReportOpen] = useState(false);
  const [isInventoryManagementOpen, setIsInventoryManagementOpen] = useState(false);
  const [isStaffSchedulingOpen, setIsStaffSchedulingOpen] = useState(false);

  useEffect(() => {
    fetchManagerData();
  }, [selectedPeriod]);

  const fetchManagerData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch staff performance data
      const staffResponse = await axios.get(`${BASE_URL}/api/staff/performance?period=${selectedPeriod}`, {
        withCredentials: true
      });
      setStaffMembers(staffResponse.data);

      // Fetch performance metrics
      const metricsResponse = await axios.get(`${BASE_URL}/api/manager/metrics?period=${selectedPeriod}`, {
        withCredentials: true
      });
      setMetrics(metricsResponse.data);

      // Fetch inventory alerts
      const inventoryResponse = await axios.get(`${BASE_URL}/api/inventory/alerts`, {
        withCredentials: true
      });
      setInventoryAlerts(inventoryResponse.data);
    } catch (error) {
      console.error('Failed to fetch manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlertColor = (alertType: string) => {
    return alertType === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome, {user?.name}! Monitor operations and team performance</p>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'today' | 'week' | 'month')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {selectedPeriod === 'today' ? 'Daily' : selectedPeriod === 'week' ? 'Weekly' : 'Monthly'} Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{(selectedPeriod === 'today' ? metrics.dailyRevenue : metrics.monthlyRevenue).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inventory Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.inventoryAlerts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">{metrics.completionRate}%</div>
            <p className="text-sm text-gray-600 mt-1">Appointments completed on time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Avg Service Time</h3>
              <ClockIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600">{metrics.averageServiceTime} min</div>
            <p className="text-sm text-gray-600 mt-1">Average time per service</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Customer Satisfaction</h3>
              <ChartBarIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600">{metrics.customerSatisfaction}/5</div>
            <p className="text-sm text-gray-600 mt-1">Average customer rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staff Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Staff Performance</h2>
            </div>
            <div className="p-6">
              {staffMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No staff data available</p>
              ) : (
                <div className="space-y-4">
                  {staffMembers.map((staff) => (
                    <div key={staff._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {staff.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Services</p>
                            <p className="font-semibold">{staff.performance.totalServices}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="font-semibold">₹{staff.performance.revenue.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Rating</p>
                            <p className={`font-semibold ${getPerformanceColor(staff.performance.rating)}`}>
                              {staff.performance.rating}/5
                            </p>
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {staff.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Inventory Alerts</h2>
            </div>
            <div className="p-6">
              {inventoryAlerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No inventory alerts</p>
              ) : (
                <div className="space-y-3">
                  {inventoryAlerts.map((alert) => (
                    <div key={alert._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.productName}</h4>
                          <p className="text-sm text-gray-600">
                            Current: {alert.currentStock} | Min: {alert.minimumStock}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertColor(alert.alertType)}`}>
                        {alert.alertType === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setIsStaffSchedulingOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Staff Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">Manage staff working hours</p>
            </button>
            <button 
              onClick={() => setIsPerformanceReportOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Performance Reports</h3>
              <p className="text-sm text-gray-600 mt-1">Generate detailed reports</p>
            </button>
            <button 
              onClick={() => setIsInventoryManagementOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Inventory Management</h3>
              <p className="text-sm text-gray-600 mt-1">Update stock levels</p>
            </button>
            <button 
              onClick={() => setIsStaffManagementOpen(true)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <h3 className="font-medium text-gray-900">Staff Management</h3>
              <p className="text-sm text-gray-600 mt-1">Manage staff details</p>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <StaffManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        onStaffUpdated={(updatedStaff) => {
          // Update the staff member in the local state
          setStaffMembers(prev => 
            prev.map(staff => 
              staff._id === updatedStaff._id ? { ...staff, ...updatedStaff } : staff
            )
          );
        }}
      />
      
      <PerformanceReportModal
        isOpen={isPerformanceReportOpen}
        onClose={() => setIsPerformanceReportOpen(false)}
      />
      
      <InventoryManagementModal
        isOpen={isInventoryManagementOpen}
        onClose={() => setIsInventoryManagementOpen(false)}
      />
      
      <StaffSchedulingModal
        isOpen={isStaffSchedulingOpen}
        onClose={() => setIsStaffSchedulingOpen(false)}
      />
    </div>
  );
};

export default ManagerDashboard;