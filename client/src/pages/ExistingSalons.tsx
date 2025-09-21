import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BuildingOfficeIcon,
  EyeIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  MapPinIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import SuperAdminLayout from '../components/layouts/SuperAdminLayout';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ExistingSalon {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  salonType: string;
  servicesOffered: string[];
  operatingHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  totalStaff: number;
  businessRegistrationNumber: string;
  gstNumber: string;
  ownerName: string;
  status: 'approved';
  submittedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  isActive: boolean;
}

const ExistingSalons = () => {
  const [salons, setSalons] = useState<ExistingSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState<ExistingSalon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/super-admin/existing-salons`, {
        withCredentials: true
      });
      setSalons(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch existing salons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (salonId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${BASE_URL}/api/super-admin/toggle-salon-status/${salonId}`, {
        isActive: !currentStatus
      }, {
        withCredentials: true
      });
      toast.success(`Salon ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchSalons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update salon status');
    }
  };

  const openModal = (salon: ExistingSalon) => {
    setSelectedSalon(salon);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSalon(null);
  };

  const filteredSalons = salons.filter(salon => {
    const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salon.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && salon.isActive) ||
                         (statusFilter === 'inactive' && !salon.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Existing Salons</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage approved salons and their operational status.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search salons, owners, or cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Salons</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved On
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSalons.map((salon) => (
                      <tr key={salon._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <BuildingOfficeIcon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{salon.name}</div>
                              <div className="text-sm text-gray-500">{salon.salonType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{salon.ownerName}</div>
                          <div className="text-sm text-gray-500">{salon.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {salon.address.city}, {salon.address.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {salon.totalStaff}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            salon.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {salon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {new Date(salon.reviewedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => openModal(salon)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleToggleStatus(salon._id, salon.isActive)}
                            className={`inline-flex items-center ${
                              salon.isActive 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {salon.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {filteredSalons.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No salons found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No salons match your current search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedSalon && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Salon Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Salon Name</label>
                      <p className="text-sm text-gray-900">{selectedSalon.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Salon Type</label>
                      <p className="text-sm text-gray-900">{selectedSalon.salonType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner Name</label>
                      <p className="text-sm text-gray-900">{selectedSalon.ownerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Staff</label>
                      <p className="text-sm text-gray-900">{selectedSalon.totalStaff}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedSalon.email}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedSalon.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
                  <p className="text-sm text-gray-900">
                    {selectedSalon.address.street}, {selectedSalon.address.city}, {selectedSalon.address.state} {selectedSalon.address.zipCode}
                  </p>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSalon.servicesOffered.map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Operating Hours</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedSalon.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">{day}:</span>
                        <span className="text-gray-900">
                          {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Number</label>
                      <p className="text-sm text-gray-900">{selectedSalon.businessRegistrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">GST Number</label>
                      <p className="text-sm text-gray-900">{selectedSalon.gstNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Status Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedSalon.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSalon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Approved On</label>
                      <p className="text-sm text-gray-900">{new Date(selectedSalon.reviewedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default ExistingSalons;