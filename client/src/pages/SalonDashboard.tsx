import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, ChartBarIcon, CurrencyDollarIcon, UsersIcon, CalendarDaysIcon, Cog6ToothIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import AddBranchForm from '../components/AddBranchForm';
import EditBranchForm from '../components/EditBranchForm';
import BusinessAnalyticsModal from '../components/BusinessAnalyticsModal';
import SystemSettingsModal from '../components/SystemSettingsModal';
import FinancialReportsModal from '../components/FinancialReportsModal';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Branch {
  _id: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  status: 'active' | 'inactive';
}

interface BusinessMetrics {
  totalRevenue: number;
  totalAppointments: number;
  activeStaff: number;
  totalCustomers: number;
}

const SalonDashboard = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    totalAppointments: 0,
    activeStaff: 0,
    totalCustomers: 0
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Admin Modal States
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFinancialReportsModalOpen, setIsFinancialReportsModalOpen] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/branches`, { withCredentials: true });
      setBranches(data);
    } catch (error) {
      console.error("Failed to fetch branches", error);
      toast.error("Could not fetch branches.");
    }
  }, []);

  const fetchBusinessMetrics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/salons/business-metrics`, { withCredentials: true });
      setBusinessMetrics(data);
    } catch (error) {
      console.error("Failed to fetch business metrics", error);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchBusinessMetrics();
  }, [fetchBranches, fetchBusinessMetrics]);

  const handleEditClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsEditModalOpen(true);
  };

  const handleStatusToggle = async (branch: Branch) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`${BASE_URL}/api/branches/${branch._id}`, 
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success(`Branch status updated to ${newStatus}`);
      fetchBranches(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };
  
  const filteredBranches = useMemo(() => {
    return branches
      .filter(branch => {
        if (statusFilter === 'all') return true;
        return branch.status === statusFilter;
      })
      .filter(branch => {
        const query = searchQuery.toLowerCase();
        return (
          branch.branchName.toLowerCase().includes(query) ||
          branch.city.toLowerCase().includes(query) ||
          branch.address.toLowerCase().includes(query)
        );
      });
  }, [branches, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Salon Management Dashboard</h1>
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            <PlusIcon className="-ml-1 h-5 w-5" />
            Add Branch
          </button>
        </div>

        {/* Business Overview Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{businessMetrics.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{businessMetrics.totalAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-900">{businessMetrics.activeStaff}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{businessMetrics.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Branch Management</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or address..."
              className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <div key={branch._id} className="flex flex-col justify-between rounded-lg bg-white p-6 shadow">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800">{branch.branchName}</h3>
                    <p className="mt-2 text-sm text-gray-500">{`${branch.address}, ${branch.city}`}</p>
                  </div>
                  <button onClick={() => handleEditClick(branch)} className="ml-4 flex-shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600">
                    <PencilIcon className="h-5 w-5"/>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Link to={`/branch/${branch._id}/dashboard`} className="text-sm font-semibold text-blue-600 hover:underline">
                    Go to Dashboard →
                </Link>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${branch.status === 'inactive' ? 'text-gray-900' : 'text-gray-400'}`}>Inactive</span>
                  <button
                      type="button"
                      onClick={() => handleStatusToggle(branch)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          branch.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          branch.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                      }`}/>
                  </button>
                  <span className={`text-sm font-medium ${branch.status === 'active' ? 'text-blue-600' : 'text-gray-400'}`}>Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center mb-3">
                <ChartBarIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                <h3 className="ml-3 font-medium text-gray-900">Business Analytics</h3>
              </div>
              <p className="text-sm text-gray-600">View detailed business insights, performance metrics, and growth analytics</p>
            </button>
            
            <button 
              onClick={() => setIsFinancialReportsModalOpen(true)}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center mb-3">
                <DocumentChartBarIcon className="h-8 w-8 text-green-600 group-hover:text-green-700" />
                <h3 className="ml-3 font-medium text-gray-900">Financial Reports</h3>
              </div>
              <p className="text-sm text-gray-600">Generate comprehensive financial reports, P&L statements, and tax information</p>
            </button>
            
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors group"
            >
              <div className="flex items-center mb-3">
                <Cog6ToothIcon className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
                <h3 className="ml-3 font-medium text-gray-900">System Settings</h3>
              </div>
              <p className="text-sm text-gray-600">Configure business hours, notifications, payment settings, and security options</p>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AddBranchForm isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchBranches}/>
      <EditBranchForm isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={fetchBranches} branch={selectedBranch}/>
      
      <BusinessAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />
      
      <FinancialReportsModal
        isOpen={isFinancialReportsModalOpen}
        onClose={() => setIsFinancialReportsModalOpen(false)}
      />
      
      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default SalonDashboard;