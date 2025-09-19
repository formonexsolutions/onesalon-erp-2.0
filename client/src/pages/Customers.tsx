import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosConfig';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import CustomerForm from '../components/CustomerForm';
import { toast } from 'react-toastify';

interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCustomers: number;
}

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0,
  });
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async (page = 1) => {
    try {
      const { data } = await axios.get(`/api/customers`, {
        params: { page, limit, search: debouncedSearch },
      });
      setCustomers(data.customers);
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalCustomers: data.totalCustomers,
      });
    } catch (error) {
      console.error("Failed to fetch customers", error);
      toast.error("Could not fetch customers.");
    }
  }, [limit, debouncedSearch]);

  useEffect(() => {
    fetchCustomers(1);
  }, [debouncedSearch, limit, fetchCustomers]);
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchCustomers(newPage);
    }
  };

  const handleAddClick = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const startItem = (pagination.currentPage - 1) * limit + 1;
  const endItem = Math.min(startItem + limit - 1, pagination.totalCustomers);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
        <button 
          onClick={handleAddClick}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5" />
          Add Customer
        </button>
      </div>
      
      {/* --- Search and Limit Controls --- */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-x-2">
            <label htmlFor="limit-select" className="text-sm text-gray-600">Show:</label>
            <select
                id="limit-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
            >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
            </select>
        </div>
      </div>
      
      {/* --- Customer Table --- */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{customer.phoneNumber}</div>
                    <div className="text-xs text-gray-400">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditClick(customer)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {/* <button onClick={() => handleDeleteClick(customer._id)} className="text-red-600 hover:text-red-900">
                      <TrashIcon className="h-5 w-5" />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination Controls --- */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{customers.length > 0 ? startItem : 0}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{pagination.totalCustomers}</span> results
        </div>
        <div className="inline-flex items-center space-x-2">
            <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
                Previous
            </button>
            <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages || pagination.totalCustomers === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
                Next
            </button>
        </div>
      </div>

      <CustomerForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchCustomers(pagination.currentPage)}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};

export default CustomersPage;