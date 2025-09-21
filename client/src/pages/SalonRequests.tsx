import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import SuperAdminLayout from '../components/layouts/SuperAdminLayout';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SalonRequest {
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
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

const SalonRequests = () => {
  const [requests, setRequests] = useState<SalonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SalonRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/super-admin/salon-requests`, {
        withCredentials: true
      });
      setRequests(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch salon requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/super-admin/approve-salon/${requestId}`, {}, {
        withCredentials: true
      });
      toast.success('Salon approved successfully');
      setIsModalOpen(false);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve salon');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/super-admin/reject-salon/${requestId}`, {
        reason: rejectionReason
      }, {
        withCredentials: true
      });
      toast.success('Salon rejected successfully');
      setIsModalOpen(false);
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject salon');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const openModal = (request: SalonRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

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
            <h1 className="text-2xl font-semibold text-gray-900">Salon Requests</h1>
            <p className="mt-2 text-sm text-gray-700">
              Review and manage salon registration requests.
            </p>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <BuildingOfficeIcon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{request.name}</div>
                              <div className="text-sm text-gray-500">{request.salonType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.ownerName}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.address.city}</div>
                          <div className="text-sm text-gray-500">{request.address.state}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openModal(request)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View Details
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
      </div>

      {/* Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Salon Request Details</h3>
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
                      <p className="text-sm text-gray-900">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Salon Type</label>
                      <p className="text-sm text-gray-900">{selectedRequest.salonType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner Name</label>
                      <p className="text-sm text-gray-900">{selectedRequest.ownerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Staff</label>
                      <p className="text-sm text-gray-900">{selectedRequest.totalStaff}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedRequest.email}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{selectedRequest.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.address.street}, {selectedRequest.address.city}, {selectedRequest.address.state} {selectedRequest.address.zipCode}
                  </p>
                </div>

                {/* Services */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Services Offered</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.servicesOffered.map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Business Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Number</label>
                      <p className="text-sm text-gray-900">{selectedRequest.businessRegistrationNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">GST Number</label>
                      <p className="text-sm text-gray-900">{selectedRequest.gstNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Status</h4>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-sm text-gray-500">
                      Submitted on {new Date(selectedRequest.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Rejection Reason</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Action Buttons for Pending Requests */}
                {selectedRequest.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Provide a reason for rejection..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprove(selectedRequest._id)}
                        disabled={actionLoading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(selectedRequest._id)}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SalonRequests;