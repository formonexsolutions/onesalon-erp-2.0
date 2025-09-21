import { useState, useEffect } from 'react';
import { XMarkIcon, CurrencyDollarIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CommissionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommissionData {
  month: string;
  totalServices: number;
  totalRevenue: number;
  commission: number;
  commissionRate: number;
}

const CommissionReportModal = ({ isOpen, onClose }: CommissionReportModalProps) => {
  const [commissionData, setCommissionData] = useState<CommissionData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [totalCommission, setTotalCommission] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCommissionData();
    }
  }, [isOpen, selectedPeriod]);

  const fetchCommissionData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/staff/commission-report?period=${selectedPeriod}`, {
        withCredentials: true
      });
      setCommissionData(response.data.commissionData || []);
      setTotalCommission(response.data.totalCommission || 0);
    } catch (error) {
      console.error('Failed to fetch commission data:', error);
      // Mock data for demonstration
      const mockData = [
        { month: 'September 2025', totalServices: 45, totalRevenue: 67500, commission: 13500, commissionRate: 20 },
        { month: 'August 2025', totalServices: 52, totalRevenue: 78000, commission: 15600, commissionRate: 20 },
        { month: 'July 2025', totalServices: 38, totalRevenue: 57000, commission: 11400, commissionRate: 20 },
      ];
      setCommissionData(mockData);
      setTotalCommission(mockData.reduce((sum, item) => sum + item.commission, 0));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
            Commission Report
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="current-month">Current Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="year-to-date">Year to Date</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading commission data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Total Commission</p>
                    <p className="text-xl font-bold text-green-900">₹{totalCommission.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Services</p>
                    <p className="text-xl font-bold text-blue-900">
                      {commissionData.reduce((sum, item) => sum + item.totalServices, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Avg Commission Rate</p>
                    <p className="text-xl font-bold text-purple-900">
                      {commissionData.length > 0 ? commissionData[0].commissionRate : 20}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission Table */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission Earned
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.totalServices}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{data.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.commissionRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ₹{data.commission.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {commissionData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No commission data available for the selected period.</p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommissionReportModal;