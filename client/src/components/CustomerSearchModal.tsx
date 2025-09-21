import { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon, PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: Customer) => void;
}

interface Customer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  lastVisit?: string;
  totalVisits: number;
  totalSpent: number;
}

const CustomerSearchModal = ({ isOpen, onClose, onCustomerSelect }: CustomerSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customerName: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    if (isOpen && searchTerm.length >= 2) {
      searchCustomers();
    } else if (isOpen && searchTerm.length === 0) {
      fetchRecentCustomers();
    }
  }, [isOpen, searchTerm]);

  const searchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/customers/search?q=${searchTerm}`, {
        withCredentials: true
      });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
      // Mock data for demonstration
      const mockCustomers = [
        {
          _id: '1',
          customerName: 'Sarah Johnson',
          phoneNumber: '+91 98765 43210',
          email: 'sarah@example.com',
          lastVisit: '2025-01-10',
          totalVisits: 15,
          totalSpent: 25000
        },
        {
          _id: '2',
          customerName: 'Mike Chen',
          phoneNumber: '+91 87654 32109',
          email: 'mike@example.com',
          lastVisit: '2025-01-08',
          totalVisits: 8,
          totalSpent: 12000
        }
      ].filter(customer => 
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
      setCustomers(mockCustomers);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/customers/recent`, {
        withCredentials: true
      });
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch recent customers:', error);
      // Mock data for demonstration
      const mockCustomers = [
        {
          _id: '1',
          customerName: 'Sarah Johnson',
          phoneNumber: '+91 98765 43210',
          email: 'sarah@example.com',
          lastVisit: '2025-01-10',
          totalVisits: 15,
          totalSpent: 25000
        },
        {
          _id: '2',
          customerName: 'Mike Chen',
          phoneNumber: '+91 87654 32109',
          email: 'mike@example.com',
          lastVisit: '2025-01-08',
          totalVisits: 8,
          totalSpent: 12000
        },
        {
          _id: '3',
          customerName: 'Emily Davis',
          phoneNumber: '+91 76543 21098',
          email: 'emily@example.com',
          lastVisit: '2025-01-05',
          totalVisits: 22,
          totalSpent: 35000
        }
      ];
      setCustomers(mockCustomers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/customers`, newCustomer, {
        withCredentials: true
      });
      const customer = response.data.customer;
      onCustomerSelect(customer);
      onClose();
    } catch (error) {
      console.error('Failed to add customer:', error);
      // For demo, create mock customer
      const mockCustomer = {
        _id: Date.now().toString(),
        ...newCustomer,
        totalVisits: 0,
        totalSpent: 0
      };
      onCustomerSelect(mockCustomer);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
            Select Customer
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {!showAddCustomer ? (
          <>
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone number..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Add New Customer Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add New Customer
              </button>
            </div>

            {/* Customer List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Searching customers...</p>
                </div>
              ) : customers.length > 0 ? (
                <div className="space-y-2">
                  {customers.map((customer) => (
                    <div
                      key={customer._id}
                      onClick={() => {
                        onCustomerSelect(customer);
                        onClose();
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{customer.customerName}</h4>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {customer.phoneNumber}
                          </p>
                          {customer.email && (
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{customer.totalVisits} visits</p>
                          <p className="text-sm font-medium text-green-600">₹{customer.totalSpent.toLocaleString()}</p>
                          {customer.lastVisit && (
                            <p className="text-xs text-gray-500">
                              Last: {new Date(customer.lastVisit).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No customers found' : 'Start typing to search customers'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Add New Customer Form */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                value={newCustomer.customerName}
                onChange={(e) => setNewCustomer({...newCustomer, customerName: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={newCustomer.phoneNumber}
                onChange={(e) => setNewCustomer({...newCustomer, phoneNumber: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="customer@example.com"
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleAddCustomer}
                disabled={!newCustomer.customerName || !newCustomer.phoneNumber}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Customer
              </button>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Back to Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearchModal;