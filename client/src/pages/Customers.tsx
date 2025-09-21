import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CakeIcon,
  UserPlusIcon,
  GiftIcon,
  ChartBarIcon,
  ClockIcon,
  PhoneIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth?: string;
  anniversary?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  customerType: 'appointment' | 'walkin';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  loyaltyPoints: number;
  preferredServices?: string[];
  skinType?: string;
  hairType?: string;
  allergies?: string[];
  specialInstructions?: string;
  communicationPreferences?: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    promotionalMessages: boolean;
  };
  referralCode?: string;
  referredBy?: {
    _id: string;
    name: string;
    phoneNumber: string;
  };
  referralCount: number;
  totalVisits: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit?: string;
  nextVisit?: string;
  customerLifetimeValue: number;
  isActive: boolean;
  blacklisted: boolean;
  blacklistReason?: string;
  notes?: string;
  createdAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  modifiedBy?: {
    name: string;
    email: string;
  };
}

interface CustomerAnalytics {
  overview: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
  };
  distributions: {
    loyaltyTiers: Array<{ _id: string; count: number }>;
    customerTypes: Array<{ _id: string; count: number }>;
  };
  birthdayCustomers: Array<{
    _id: string;
    name: string;
    phoneNumber: string;
    dateOfBirth: string;
  }>;
  topCustomers: Array<{
    _id: string;
    name: string;
    phoneNumber: string;
    totalSpent: number;
    totalVisits: number;
    loyaltyTier: string;
  }>;
  recentActivity: {
    totalVisits: number;
    totalRevenue: number;
    averageSpent: number;
    averageRating: number;
  };
}

interface Celebration {
  _id: string;
  name: string;
  phoneNumber: string;
  dateOfBirth?: string;
  anniversary?: string;
  loyaltyTier: string;
  communicationPreferences: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    promotionalMessages: boolean;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
}

const Customers: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [celebrations, setCelebrations] = useState<{ birthdays: Celebration[]; anniversaries: Celebration[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState<'customers' | 'analytics' | 'celebrations'>('customers');
  const [filters, setFilters] = useState({
    loyaltyTier: '',
    isActive: '',
    customerType: ''
  });

  // Fetch customer analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/customers/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
    }
  };

  // Fetch upcoming celebrations
  const fetchCelebrations = async () => {
    try {
      const response = await fetch('/api/customers/celebrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCelebrations(data.data);
      }
    } catch (error) {
      console.error('Error fetching celebrations:', error);
    }
  };

  // Fetch customers with pagination and search
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.loyaltyTier && { loyaltyTier: filters.loyaltyTier }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.customerType && { customerType: filters.customerType })
      });

      const response = await fetch(`/api/customers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchCelebrations();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, sortBy, sortOrder, filters]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getLoyaltyBadgeColor = (tier: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
      vip: 'bg-red-100 text-red-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderCustomersTab = () => (
    <>
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.loyaltyTier}
            onChange={(e) => handleFilterChange('loyaltyTier', e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Loyalty Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="vip">VIP</option>
          </select>

          <select
            value={filters.customerType}
            onChange={(e) => handleFilterChange('customerType', e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Customer Types</option>
            <option value="appointment">Appointment</option>
            <option value="walkin">Walk-in</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No customers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Customer
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loyalty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastVisit')}
                    >
                      Last Visit
                      {sortBy === 'lastVisit' && (
                        <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {customer.name}
                              {!customer.isActive && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                              {customer.blacklisted && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Blacklisted
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.customerType === 'appointment' ? 'Appointment Customer' : 'Walk-in Customer'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.phoneNumber}</div>
                        <div className="text-sm text-gray-500">{customer.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getLoyaltyBadgeColor(customer.loyaltyTier)}`}>
                          {customer.loyaltyTier}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{customer.loyaltyPoints} points</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{customer.totalVisits} visits</div>
                        <div className="text-gray-500">{formatCurrency(customer.totalSpent)} spent</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.lastVisit ? formatDate(customer.lastVisit) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900"
                            title="Add Visit"
                          >
                            <ClockIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} customers
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  const renderAnalyticsTab = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserPlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.newCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HeartIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.retentionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity (Last 30 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.recentActivity.totalVisits}</div>
              <div className="text-sm text-gray-600">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.recentActivity.totalRevenue)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.recentActivity.averageSpent)}</div>
              <div className="text-sm text-gray-600">Average Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{analytics.recentActivity.averageRating?.toFixed(1) || 'N/A'}</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers by Spending</h3>
          <div className="space-y-3">
            {analytics.topCustomers.map((customer, index) => (
              <div key={customer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-xs text-gray-500">{customer.totalVisits} visits</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Loyalty Tier Distribution</h3>
          <div className="space-y-3">
            {analytics.distributions.loyaltyTiers.map((tier) => (
              <div key={tier._id} className="flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getLoyaltyBadgeColor(tier._id)}`}>
                  {tier._id}
                </span>
                <span className="text-sm font-medium text-gray-900">{tier.count} customers</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCelebrationsTab = () => {
    if (!celebrations) return <div>Loading celebrations...</div>;

    return (
      <div className="space-y-6">
        {/* Upcoming Birthdays */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <CakeIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Upcoming Birthdays (Next 30 Days)</h3>
          </div>
          {celebrations.birthdays.length === 0 ? (
            <p className="text-gray-500">No upcoming birthdays</p>
          ) : (
            <div className="space-y-3">
              {celebrations.birthdays.map((customer) => (
                <div key={customer._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <CakeIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-yellow-600">
                      {new Date(customer.dateOfBirth!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {customer.communicationPreferences.sms && (
                        <PhoneIcon className="h-3 w-3 text-green-500" title="SMS enabled" />
                      )}
                      {customer.communicationPreferences.email && (
                        <span className="text-xs text-blue-500" title="Email enabled">@</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Anniversaries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <GiftIcon className="h-6 w-6 text-pink-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Upcoming Anniversaries (Next 30 Days)</h3>
          </div>
          {celebrations.anniversaries.length === 0 ? (
            <p className="text-gray-500">No upcoming anniversaries</p>
          ) : (
            <div className="space-y-3">
              {celebrations.anniversaries.map((customer) => (
                <div key={customer._id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <GiftIcon className="h-5 w-5 text-pink-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">{customer.phoneNumber}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-pink-600">
                      {new Date(customer.anniversary!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex space-x-1 mt-1">
                      {customer.communicationPreferences.sms && (
                        <PhoneIcon className="h-3 w-3 text-green-500" title="SMS enabled" />
                      )}
                      {customer.communicationPreferences.email && (
                        <span className="text-xs text-blue-500" title="Email enabled">@</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customer Relationship Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Comprehensive customer management with analytics and insights
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserGroupIcon className="h-5 w-5 inline mr-2" />
            Customers
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('celebrations')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'celebrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CakeIcon className="h-5 w-5 inline mr-2" />
            Celebrations
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'customers' && renderCustomersTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
      {activeTab === 'celebrations' && renderCelebrationsTab()}
    </div>
  );
};

export default Customers;