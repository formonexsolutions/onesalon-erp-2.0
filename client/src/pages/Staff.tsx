import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Staff {
  _id: string;
  employeeId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  username?: string;
  role: string;
  gender: string;
  dateOfBirth?: string;
  address?: string;
  designation?: string;
  specialization: string[];
  salonId: {
    _id: string;
    salonName: string;
  };
  branchId?: {
    _id: string;
    branchName: string;
    location: string;
  };
  isActive: boolean;
  canReceiveAppointments: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
  };
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  availableForAppointments: number;
  recentAdditions: number;
  roleStats: Array<{
    _id: string;
    count: number;
  }>;
  specializationStats: Array<{
    _id: string;
    count: number;
  }>;
  branchStats: Array<{
    _id: {
      branchId: string;
      branchName: string;
    };
    count: number;
  }>;
  distribution: {
    active: number;
    inactive: number;
    canTakeAppointments: number;
  };
}

interface StaffFormData {
  name: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  designation: string;
  specialization: string[];
  branchId: string;
  canReceiveAppointments: boolean;
  documents: {
    panCard: string;
    aadhaarCard: string;
  };
}

const Staff: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBranch] = useState(''); // Unused but keeping for future branch filtering
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [staffForm, setStaffForm] = useState<StaffFormData>({
    name: '',
    phoneNumber: '',
    email: '',
    username: '',
    password: '',
    role: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    designation: '',
    specialization: [],
    branchId: '',
    canReceiveAppointments: true,
    documents: {
      panCard: '',
      aadhaarCard: ''
    }
  });

  const roles = [
    'salonadmin', 'branchadmin', 'stylist', 'receptionist', 'manager', 'clerk'
  ];

  const specializations = [
    'Hair Dressing', 'Facial', 'Massage', 'Manicure', 'Pedicure', 'Hair Coloring', 'Hair Styling'
  ];

  const genders = ['male', 'female', 'other'];

  useEffect(() => {
    fetchStaff();
    fetchStats();
  }, [currentPage, searchTerm, selectedRole, selectedBranch, selectedStatus, sortBy, sortOrder]);

  const fetchStaff = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedRole) params.append('role', selectedRole);
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedStatus) params.append('isActive', selectedStatus);

      const response = await axios.get(`/api/staff?${params}`);
      setStaff(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/staff/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/staff', staffForm);
      setShowStaffForm(false);
      resetForm();
      fetchStaff();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      alert(error.response?.data?.message || 'Error creating staff member');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      const updateData = { ...staffForm };
      delete (updateData as any).password; // Don't send password in update

      await axios.put(`/api/staff/${editingStaff._id}`, updateData);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
      fetchStats();
    } catch (error: any) {
      console.error('Error updating staff:', error);
      alert(error.response?.data?.message || 'Error updating staff member');
    }
  };

  const handleToggleStatus = async (staffId: string) => {
    try {
      await axios.patch(`/api/staff/${staffId}/toggle-status`);
      fetchStaff();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleToggleAppointments = async (staffId: string) => {
    try {
      await axios.patch(`/api/staff/${staffId}/toggle-appointments`);
      fetchStaff();
      fetchStats();
    } catch (error: any) {
      console.error('Error toggling appointments:', error);
      alert(error.response?.data?.message || 'Error updating appointment availability');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await axios.delete(`/api/staff/${staffId}`);
      fetchStaff();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      alert(error.response?.data?.message || 'Error deleting staff member');
    }
  };

  const resetForm = () => {
    setStaffForm({
      name: '',
      phoneNumber: '',
      email: '',
      username: '',
      password: '',
      role: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      designation: '',
      specialization: [],
      branchId: '',
      canReceiveAppointments: true,
      documents: {
        panCard: '',
        aadhaarCard: ''
      }
    });
  };

  const startEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setStaffForm({
      name: staffMember.name,
      phoneNumber: staffMember.phoneNumber,
      email: staffMember.email || '',
      username: staffMember.username || '',
      password: '', // Don't prefill password
      role: staffMember.role,
      gender: staffMember.gender,
      dateOfBirth: staffMember.dateOfBirth ? staffMember.dateOfBirth.split('T')[0] : '',
      address: staffMember.address || '',
      designation: staffMember.designation || '',
      specialization: staffMember.specialization || [],
      branchId: staffMember.branchId?._id || '',
      canReceiveAppointments: staffMember.canReceiveAppointments,
      documents: {
        panCard: '',
        aadhaarCard: ''
      }
    });
    setShowStaffForm(true);
  };

  const cancelEdit = () => {
    setEditingStaff(null);
    setShowStaffForm(false);
    resetForm();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'salonadmin': return 'bg-purple-100 text-purple-800';
      case 'branchadmin': return 'bg-blue-100 text-blue-800';
      case 'stylist': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-yellow-100 text-yellow-800';
      case 'manager': return 'bg-indigo-100 text-indigo-800';
      case 'clerk': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    if (checked) {
      setStaffForm(prev => ({
        ...prev,
        specialization: [...prev.specialization, specialization]
      }));
    } else {
      setStaffForm(prev => ({
        ...prev,
        specialization: prev.specialization.filter(s => s !== specialization)
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage staff members, roles, and schedules</p>
        </div>
        <button
          onClick={() => setShowStaffForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Staff</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStaff}</p>
              </div>
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-semibold">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeStaff}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available for Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{stats.availableForAppointments}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Additions</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recentAdditions}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">🆕</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search staff..."
              className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <div className="flex space-x-2">
            <select
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="employeeId">Employee ID</option>
              <option value="createdAt">Created Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                      <div className="text-sm text-gray-500">ID: {staffMember.employeeId}</div>
                      {staffMember.designation && (
                        <div className="text-xs text-gray-400">{staffMember.designation}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                      {staffMember.role}
                    </span>
                    {staffMember.specialization.length > 0 && (
                      <div className="mt-1">
                        {staffMember.specialization.slice(0, 2).map((spec, index) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mt-1">
                            {spec}
                          </span>
                        ))}
                        {staffMember.specialization.length > 2 && (
                          <span className="text-xs text-gray-500">+{staffMember.specialization.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{staffMember.phoneNumber}</div>
                    {staffMember.email && (
                      <div className="text-sm text-gray-500">{staffMember.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {staffMember.branchId?.branchName || 'Not Assigned'}
                    </div>
                    {staffMember.branchId?.location && (
                      <div className="text-xs text-gray-500">{staffMember.branchId.location}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staffMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {staffMember.isActive && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staffMember.canReceiveAppointments ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {staffMember.canReceiveAppointments ? 'Available' : 'Unavailable'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => startEdit(staffMember)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleStatus(staffMember._id)}
                        className={`${staffMember.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={staffMember.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {staffMember.isActive ? '⏸️' : '▶️'}
                      </button>
                      {staffMember.isActive && (
                        <button
                          onClick={() => handleToggleAppointments(staffMember._id)}
                          className={`${staffMember.canReceiveAppointments ? 'text-yellow-600 hover:text-yellow-900' : 'text-blue-600 hover:text-blue-900'}`}
                          title={staffMember.canReceiveAppointments ? 'Make Unavailable' : 'Make Available'}
                        >
                          {staffMember.canReceiveAppointments ? '📅' : '🚫'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStaff(staffMember._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <form onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.phoneNumber}
                      onChange={(e) => setStaffForm({ ...staffForm, phoneNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.username}
                      onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    />
                  </div>

                  {!editingStaff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password *</label>
                      <input
                        type="password"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={staffForm.password}
                        onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender *</label>
                    <select
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.gender}
                      onChange={(e) => setStaffForm({ ...staffForm, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      {genders.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.dateOfBirth}
                      onChange={(e) => setStaffForm({ ...staffForm, dateOfBirth: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={staffForm.designation}
                      onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={staffForm.address}
                    onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specializations.map((spec) => (
                      <label key={spec} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          checked={staffForm.specialization.includes(spec)}
                          onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canReceiveAppointments"
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    checked={staffForm.canReceiveAppointments}
                    onChange={(e) => setStaffForm({ ...staffForm, canReceiveAppointments: e.target.checked })}
                  />
                  <label htmlFor="canReceiveAppointments" className="ml-2 text-sm text-gray-700">
                    Can receive appointments
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;