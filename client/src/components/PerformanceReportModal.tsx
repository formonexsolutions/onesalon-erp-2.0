import { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, ArrowTrendingUpIcon, UserGroupIcon, CurrencyRupeeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StaffPerformance {
  _id: string;
  staffName: string;
  role: string;
  totalServices: number;
  totalRevenue: number;
  avgRating: number;
  customerSatisfaction: number;
  attendanceRate: number;
  targetAchievement: number;
}

interface BusinessMetrics {
  totalRevenue: number;
  totalAppointments: number;
  avgServicePrice: number;
  customerRetentionRate: number;
  topServices: Array<{
    serviceName: string;
    count: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    appointments: number;
    newCustomers: number;
  }>;
}

const PerformanceReportModal = ({ isOpen, onClose }: PerformanceReportModalProps) => {
  const [reportType, setReportType] = useState<'staff' | 'business'>('staff');
  const [timeRange, setTimeRange] = useState('current-month');
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    }
  }, [isOpen, reportType, timeRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      if (reportType === 'staff') {
        const response = await axios.get(`${BASE_URL}/api/staff/performance`, {
          params: { timeframe: timeRange },
          withCredentials: true
        });
        setStaffPerformance(response.data.data?.staffPerformance || []);
      } else {
        const response = await axios.get(`${BASE_URL}/api/admin/analytics`, {
          params: { timeframe: timeRange },
          withCredentials: true
        });
        setBusinessMetrics(response.data || null);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Mock data for demonstration
      if (reportType === 'staff') {
        const mockStaffData = [
          {
            _id: '1',
            staffName: 'Priya Sharma',
            role: 'Senior Stylist',
            totalServices: 85,
            totalRevenue: 127500,
            avgRating: 4.8,
            customerSatisfaction: 96,
            attendanceRate: 98,
            targetAchievement: 115
          },
          {
            _id: '2',
            staffName: 'Anita Verma',
            role: 'Junior Stylist',
            totalServices: 62,
            totalRevenue: 93000,
            avgRating: 4.6,
            customerSatisfaction: 92,
            attendanceRate: 95,
            targetAchievement: 103
          },
          {
            _id: '3',
            staffName: 'Neha Gupta',
            role: 'Beautician',
            totalServices: 78,
            totalRevenue: 117000,
            avgRating: 4.9,
            customerSatisfaction: 98,
            attendanceRate: 97,
            targetAchievement: 125
          }
        ];
        setStaffPerformance(mockStaffData);
      } else {
        const mockBusinessData = {
          totalRevenue: 450000,
          totalAppointments: 320,
          avgServicePrice: 1406,
          customerRetentionRate: 78,
          topServices: [
            { serviceName: 'Hair Cut & Styling', count: 95, revenue: 142500 },
            { serviceName: 'Hair Color', count: 45, revenue: 135000 },
            { serviceName: 'Facial Treatment', count: 68, revenue: 102000 },
            { serviceName: 'Threading', count: 112, revenue: 22400 }
          ],
          monthlyTrends: [
            { month: 'July', revenue: 380000, appointments: 285, newCustomers: 45 },
            { month: 'August', revenue: 420000, appointments: 310, newCustomers: 52 },
            { month: 'September', revenue: 450000, appointments: 320, newCustomers: 48 }
          ]
        };
        setBusinessMetrics(mockBusinessData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportReport = () => {
    // In a real implementation, this would generate and download a PDF/Excel report
    console.log('Exporting report...', { reportType, timeRange });
    alert(`Exporting ${reportType} report for ${timeRange}...`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Performance Reports
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'staff' | 'business')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="staff">Staff Performance</option>
                <option value="business">Business Metrics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="year-to-date">Year to Date</option>
              </select>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading performance data...</p>
          </div>
        ) : (
          <>
            {reportType === 'staff' ? (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Staff Performance Overview</h4>
                
                {/* Staff Performance Table */}
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfaction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Achievement</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffPerformance.map((staff) => (
                        <tr key={staff._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{staff.staffName}</div>
                              <div className="text-sm text-gray-500">{staff.role}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.totalServices}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{staff.totalRevenue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${getPerformanceColor(staff.avgRating, 4.5)}`}>
                                {staff.avgRating}/5
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getPerformanceColor(staff.customerSatisfaction, 90)}`}>
                              {staff.customerSatisfaction}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getPerformanceColor(staff.attendanceRate, 95)}`}>
                              {staff.attendanceRate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${getPerformanceColor(staff.targetAchievement, 100)}`}>
                              {staff.targetAchievement}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total Staff</p>
                        <p className="text-xl font-bold text-blue-900">{staffPerformance.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Total Revenue</p>
                        <p className="text-xl font-bold text-green-900">
                          ₹{staffPerformance.reduce((sum, s) => sum + s.totalRevenue, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Avg Rating</p>
                        <p className="text-xl font-bold text-yellow-900">
                          {staffPerformance.length > 0 
                            ? (staffPerformance.reduce((sum, s) => sum + s.avgRating, 0) / staffPerformance.length).toFixed(1)
                            : '0.0'
                          }/5
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Total Services</p>
                        <p className="text-xl font-bold text-purple-900">
                          {staffPerformance.reduce((sum, s) => sum + s.totalServices, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              businessMetrics && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">Business Performance Overview</h4>
                  
                  {/* Business Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Total Revenue</p>
                          <p className="text-xl font-bold text-green-900">₹{businessMetrics.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Total Appointments</p>
                          <p className="text-xl font-bold text-blue-900">{businessMetrics.totalAppointments}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-600">Avg Service Price</p>
                          <p className="text-xl font-bold text-yellow-900">₹{businessMetrics.avgServicePrice}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">Customer Retention</p>
                          <p className="text-xl font-bold text-purple-900">{businessMetrics.customerRetentionRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Services */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Top Performing Services</h5>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {businessMetrics.topServices.map((service, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.serviceName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.count}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{service.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{Math.round(service.revenue / service.count)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Trends */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h5 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h5>
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Customers</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {businessMetrics.monthlyTrends.map((trend, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.month}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{trend.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trend.appointments}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trend.newCustomers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
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

export default PerformanceReportModal;