import { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface BusinessAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    daily: Array<{ date: string; amount: number; }>;
    monthly: Array<{ month: string; amount: number; }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
    completionRate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention: number;
  };
  staff: {
    performance: Array<{
      staffId: string;
      name: string;
      revenue: number;
      appointments: number;
      rating: number;
    }>;
  };
  branches: Array<{
    _id: string;
    name: string;
    revenue: number;
    appointments: number;
    staff: number;
    performance: number;
  }>;
}

const BusinessAnalyticsModal = ({ isOpen, onClose }: BusinessAnalyticsModalProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0,
      daily: [],
      monthly: []
    },
    appointments: {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      completionRate: 0
    },
    customers: {
      total: 0,
      new: 0,
      returning: 0,
      retention: 0
    },
    staff: {
      performance: []
    },
    branches: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'appointments' | 'customers'>('revenue');

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, selectedTimeframe]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/analytics`, {
        params: { timeframe: selectedTimeframe },
        withCredentials: true
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Mock data for demonstration
      const mockAnalytics = {
        revenue: {
          current: 2450000,
          previous: 2100000,
          growth: 16.7,
          daily: [
            { date: '2025-01-08', amount: 85000 },
            { date: '2025-01-09', amount: 92000 },
            { date: '2025-01-10', amount: 78000 },
            { date: '2025-01-11', amount: 115000 },
            { date: '2025-01-12', amount: 98000 },
            { date: '2025-01-13', amount: 105000 },
            { date: '2025-01-14', amount: 125000 }
          ],
          monthly: [
            { month: 'Oct', amount: 1850000 },
            { month: 'Nov', amount: 2100000 },
            { month: 'Dec', amount: 2350000 },
            { month: 'Jan', amount: 2450000 }
          ]
        },
        appointments: {
          total: 1420,
          completed: 1285,
          cancelled: 85,
          pending: 50,
          completionRate: 90.5
        },
        customers: {
          total: 3240,
          new: 285,
          returning: 2955,
          retention: 91.2
        },
        staff: {
          performance: [
            { staffId: '1', name: 'Priya Sharma', revenue: 185000, appointments: 145, rating: 4.8 },
            { staffId: '2', name: 'Rahul Patel', revenue: 165000, appointments: 132, rating: 4.6 },
            { staffId: '3', name: 'Meera Singh', revenue: 178000, appointments: 138, rating: 4.7 },
            { staffId: '4', name: 'Arjun Kumar', revenue: 142000, appointments: 118, rating: 4.5 }
          ]
        },
        branches: [
          { _id: '1', name: 'Downtown Branch', revenue: 850000, appointments: 485, staff: 12, performance: 92 },
          { _id: '2', name: 'Mall Branch', revenue: 720000, appointments: 425, staff: 10, performance: 88 },
          { _id: '3', name: 'Suburban Branch', revenue: 880000, appointments: 510, staff: 14, performance: 94 }
        ]
      };
      setAnalytics(mockAnalytics);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    }
  };

  const exportData = () => {
    const dataToExport = {
      timeframe: selectedTimeframe,
      generatedAt: new Date().toISOString(),
      analytics
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-analytics-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Business Analytics Dashboard
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d' | '12m')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="12m">Last 12 Months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Focus Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'revenue' | 'appointments' | 'customers')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="revenue">Revenue Analysis</option>
                <option value="appointments">Appointment Analysis</option>
                <option value="customers">Customer Analysis</option>
              </select>
            </div>
          </div>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export Data
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.revenue.current)}</p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-200" />
                </div>
                <div className="flex items-center mt-4">
                  {getTrendIcon(analytics.revenue.growth)}
                  <span className="ml-1 text-sm font-medium">
                    {analytics.revenue.growth > 0 ? '+' : ''}{analytics.revenue.growth.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-blue-100 text-sm">vs previous period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.appointments.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-lg font-semibold text-green-600">{analytics.appointments.completionRate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.customers.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Retention Rate</p>
                    <p className="text-lg font-semibold text-purple-600">{analytics.customers.retention}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Active Branches</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.branches.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Avg Performance</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {(analytics.branches.reduce((sum, b) => sum + b.performance, 0) / analytics.branches.length).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis Section */}
            {selectedMetric === 'revenue' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trend</h4>
                  <div className="space-y-3">
                    {analytics.revenue.daily.map((day, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(day.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h4>
                  <div className="space-y-3">
                    {analytics.revenue.monthly.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{month.month}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(month.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'appointments' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{analytics.appointments.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{analytics.appointments.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{analytics.appointments.cancelled}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{analytics.appointments.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </div>
              </div>
            )}

            {selectedMetric === 'customers' && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{analytics.customers.total}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{analytics.customers.new}</div>
                    <div className="text-sm text-gray-600 mt-1">New Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{analytics.customers.retention}%</div>
                    <div className="text-sm text-gray-600 mt-1">Retention Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Branch Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.branches.map((branch) => (
                      <tr key={branch._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(branch.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.appointments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.staff}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            branch.performance >= 90 ? 'bg-green-100 text-green-800' :
                            branch.performance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {branch.performance}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Staff Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Staff Performance</h4>
              <div className="space-y-4">
                {analytics.staff.performance.map((staff, index) => (
                  <div key={staff.staffId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{staff.name}</h5>
                        <p className="text-sm text-gray-600">{staff.appointments} appointments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(staff.revenue)}</div>
                      <div className="text-sm text-yellow-600">★ {staff.rating}/5</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalyticsModal;