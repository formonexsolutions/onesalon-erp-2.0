import { useState, useEffect } from 'react';
import { XMarkIcon, DocumentChartBarIcon, CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FinancialReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FinancialData {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    revenueGrowth: number;
  };
  revenueBreakdown: {
    serviceRevenue: number;
    productRevenue: number;
    membershipRevenue: number;
  };
  expenses: {
    staffSalaries: number;
    rent: number;
    utilities: number;
    supplies: number;
    marketing: number;
    other: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  branchPerformance: Array<{
    branchId: string;
    branchName: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
  taxInformation: {
    taxableIncome: number;
    taxOwed: number;
    taxRate: number;
    quarterlyTax: number;
  };
}

const FinancialReportsModal = ({ isOpen, onClose }: FinancialReportsModalProps) => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      revenueGrowth: 0
    },
    revenueBreakdown: {
      serviceRevenue: 0,
      productRevenue: 0,
      membershipRevenue: 0
    },
    expenses: {
      staffSalaries: 0,
      rent: 0,
      utilities: 0,
      supplies: 0,
      marketing: 0,
      other: 0
    },
    monthlyData: [],
    branchPerformance: [],
    taxInformation: {
      taxableIncome: 0,
      taxOwed: 0,
      taxRate: 0,
      quarterlyTax: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'ytd'>('current');
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'comparison'>('summary');

  useEffect(() => {
    if (isOpen) {
      fetchFinancialData();
    }
  }, [isOpen, selectedPeriod]);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/financial-reports`, {
        params: { period: selectedPeriod },
        withCredentials: true
      });
      setFinancialData(response.data);
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
      // Mock data for demonstration
      const mockData = {
        summary: {
          totalRevenue: 2450000,
          totalExpenses: 1650000,
          netProfit: 800000,
          profitMargin: 32.7,
          revenueGrowth: 15.3
        },
        revenueBreakdown: {
          serviceRevenue: 1950000,
          productRevenue: 350000,
          membershipRevenue: 150000
        },
        expenses: {
          staffSalaries: 980000,
          rent: 240000,
          utilities: 85000,
          supplies: 180000,
          marketing: 120000,
          other: 45000
        },
        monthlyData: [
          { month: 'Jan', revenue: 185000, expenses: 125000, profit: 60000 },
          { month: 'Feb', revenue: 195000, expenses: 130000, profit: 65000 },
          { month: 'Mar', revenue: 210000, expenses: 135000, profit: 75000 },
          { month: 'Apr', revenue: 205000, expenses: 140000, profit: 65000 },
          { month: 'May', revenue: 225000, expenses: 145000, profit: 80000 },
          { month: 'Jun', revenue: 235000, expenses: 150000, profit: 85000 },
          { month: 'Jul', revenue: 245000, expenses: 155000, profit: 90000 },
          { month: 'Aug', revenue: 240000, expenses: 160000, profit: 80000 },
          { month: 'Sep', revenue: 250000, expenses: 155000, profit: 95000 },
          { month: 'Oct', revenue: 255000, expenses: 165000, profit: 90000 },
          { month: 'Nov', revenue: 265000, expenses: 170000, profit: 95000 },
          { month: 'Dec', revenue: 275000, expenses: 175000, profit: 100000 }
        ],
        branchPerformance: [
          { branchId: '1', branchName: 'Downtown Branch', revenue: 850000, expenses: 580000, profit: 270000, profitMargin: 31.8 },
          { branchId: '2', branchName: 'Mall Branch', revenue: 720000, expenses: 495000, profit: 225000, profitMargin: 31.3 },
          { branchId: '3', branchName: 'Suburban Branch', revenue: 880000, expenses: 575000, profit: 305000, profitMargin: 34.7 }
        ],
        taxInformation: {
          taxableIncome: 800000,
          taxOwed: 240000,
          taxRate: 30,
          quarterlyTax: 60000
        }
      };
      setFinancialData(mockData);
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

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      reportType: reportType,
      generatedAt: new Date().toISOString(),
      data: financialData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Financial Report - ${selectedPeriod}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .metric { text-align: center; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .table th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Financial Report</h1>
              <p>Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</p>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="summary">
              <div class="metric">
                <h3>Total Revenue</h3>
                <p>${formatCurrency(financialData.summary.totalRevenue)}</p>
              </div>
              <div class="metric">
                <h3>Total Expenses</h3>
                <p>${formatCurrency(financialData.summary.totalExpenses)}</p>
              </div>
              <div class="metric">
                <h3>Net Profit</h3>
                <p>${formatCurrency(financialData.summary.netProfit)}</p>
              </div>
              <div class="metric">
                <h3>Profit Margin</h3>
                <p>${financialData.summary.profitMargin}%</p>
              </div>
            </div>
            <!-- Add more sections as needed -->
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <DocumentChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Financial Reports
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'current' | 'previous' | 'ytd')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current">Current Month</option>
                <option value="previous">Previous Month</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'summary' | 'detailed' | 'comparison')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
                <option value="comparison">Comparison</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generatePrintReport}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Print Report
            </button>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export Data
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading financial reports...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(financialData.summary.totalRevenue)}</p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
                </div>
                <div className="flex items-center mt-4">
                  {financialData.summary.revenueGrowth >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-200" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-green-200" />
                  )}
                  <span className="ml-1 text-sm font-medium">
                    {financialData.summary.revenueGrowth >= 0 ? '+' : ''}{financialData.summary.revenueGrowth.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-green-100 text-sm">vs previous period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.summary.totalExpenses)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialData.summary.netProfit)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-600">{financialData.summary.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(financialData.revenueBreakdown.serviceRevenue)}</p>
                  <p className="text-sm text-gray-600">Service Revenue</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((financialData.revenueBreakdown.serviceRevenue / financialData.summary.totalRevenue) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(financialData.revenueBreakdown.productRevenue)}</p>
                  <p className="text-sm text-gray-600">Product Sales</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((financialData.revenueBreakdown.productRevenue / financialData.summary.totalRevenue) * 100).toFixed(1)}% of total
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(financialData.revenueBreakdown.membershipRevenue)}</p>
                  <p className="text-sm text-gray-600">Memberships</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((financialData.revenueBreakdown.membershipRevenue / financialData.summary.totalRevenue) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(financialData.expenses).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.monthlyData.map((month) => {
                      const margin = ((month.profit / month.revenue) * 100);
                      return (
                        <tr key={month.month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.revenue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.expenses)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.profit)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              margin >= 30 ? 'bg-green-100 text-green-800' :
                              margin >= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.branchPerformance.map((branch) => (
                      <tr key={branch.branchId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.branchName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(branch.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(branch.expenses)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(branch.profit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            branch.profitMargin >= 30 ? 'bg-green-100 text-green-800' :
                            branch.profitMargin >= 20 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {branch.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Information */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.taxInformation.taxableIncome)}</div>
                  <div className="text-sm text-gray-600 mt-1">Taxable Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(financialData.taxInformation.taxOwed)}</div>
                  <div className="text-sm text-gray-600 mt-1">Tax Owed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{financialData.taxInformation.taxRate}%</div>
                  <div className="text-sm text-gray-600 mt-1">Tax Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(financialData.taxInformation.quarterlyTax)}</div>
                  <div className="text-sm text-gray-600 mt-1">Quarterly Tax</div>
                </div>
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

export default FinancialReportsModal;