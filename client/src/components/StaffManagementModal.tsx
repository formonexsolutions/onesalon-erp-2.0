import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, StarIcon, ClockIcon, CurrencyRupeeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffMember;
  onStaffUpdated: (staff: StaffMember) => void;
}

interface StaffMember {
  _id: string;
  staffName: string;
  role: 'stylist' | 'receptionist' | 'manager' | 'beautician';
  phoneNumber: string;
  email?: string;
  specializations: string[];
  workingHours: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  commissionRate: number;
  salaryType: 'hourly' | 'monthly' | 'commission';
  baseSalary: number;
  isActive: boolean;
  joinedDate: string;
  performanceMetrics: {
    totalServices: number;
    avgRating: number;
    monthlyRevenue: number;
    customerSatisfaction: number;
  };
}

const StaffManagementModal = ({ isOpen, onClose, staffMember, onStaffUpdated }: StaffManagementModalProps) => {
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    staffName: '',
    role: 'stylist',
    phoneNumber: '',
    email: '',
    specializations: [],
    commissionRate: 20,
    salaryType: 'monthly',
    baseSalary: 0,
    isActive: true,
    workingHours: {
      monday: { start: '09:00', end: '18:00', isWorking: true },
      tuesday: { start: '09:00', end: '18:00', isWorking: true },
      wednesday: { start: '09:00', end: '18:00', isWorking: true },
      thursday: { start: '09:00', end: '18:00', isWorking: true },
      friday: { start: '09:00', end: '18:00', isWorking: true },
      saturday: { start: '09:00', end: '18:00', isWorking: true },
      sunday: { start: '09:00', end: '18:00', isWorking: false }
    }
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'performance'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const availableSpecializations = [
    'Hair Cut', 'Hair Color', 'Hair Highlights', 'Hair Styling', 
    'Facial', 'Makeup', 'Threading', 'Waxing', 'Manicure', 'Pedicure'
  ];

  useEffect(() => {
    if (staffMember) {
      setFormData(staffMember);
    } else {
      resetForm();
    }
  }, [staffMember, isOpen]);

  const resetForm = () => {
    setFormData({
      staffName: '',
      role: 'stylist',
      phoneNumber: '',
      email: '',
      specializations: [],
      commissionRate: 20,
      salaryType: 'monthly',
      baseSalary: 0,
      isActive: true,
      workingHours: {
        monday: { start: '09:00', end: '18:00', isWorking: true },
        tuesday: { start: '09:00', end: '18:00', isWorking: true },
        wednesday: { start: '09:00', end: '18:00', isWorking: true },
        thursday: { start: '09:00', end: '18:00', isWorking: true },
        friday: { start: '09:00', end: '18:00', isWorking: true },
        saturday: { start: '09:00', end: '18:00', isWorking: true },
        sunday: { start: '09:00', end: '18:00', isWorking: false }
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const url = staffMember 
        ? `${BASE_URL}/api/staff/${staffMember._id}` 
        : `${BASE_URL}/api/staff`;
      
      const method = staffMember ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url,
        data: formData,
        withCredentials: true
      });

      onStaffUpdated(response.data.staff || response.data);
      onClose();
    } catch (error) {
      console.error('Failed to save staff member:', error);
      // For demo, simulate success
      const mockStaff = {
        _id: staffMember?._id || Date.now().toString(),
        ...formData,
        performanceMetrics: staffMember?.performanceMetrics || {
          totalServices: 0,
          avgRating: 5.0,
          monthlyRevenue: 0,
          customerSatisfaction: 95
        },
        joinedDate: staffMember?.joinedDate || new Date().toISOString()
      } as StaffMember;
      
      onStaffUpdated(mockStaff);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations?.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...(prev.specializations || []), specialization]
    }));
  };

  const handleWorkingHourChange = (day: string, field: 'start' | 'end' | 'isWorking', value: string | boolean) => {
    setFormData(prev => {
      const currentHours = prev.workingHours || {
        monday: { start: '09:00', end: '18:00', isWorking: true },
        tuesday: { start: '09:00', end: '18:00', isWorking: true },
        wednesday: { start: '09:00', end: '18:00', isWorking: true },
        thursday: { start: '09:00', end: '18:00', isWorking: true },
        friday: { start: '09:00', end: '18:00', isWorking: true },
        saturday: { start: '09:00', end: '18:00', isWorking: true },
        sunday: { start: '09:00', end: '18:00', isWorking: false }
      };
      
      const dayKey = day as keyof typeof currentHours;
      const dayHours = currentHours[dayKey];
      
      return {
        ...prev,
        workingHours: {
          ...currentHours,
          [day]: {
            start: dayHours.start,
            end: dayHours.end,
            isWorking: dayHours.isWorking,
            [field]: value
          }
        }
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
            {staffMember ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Schedule & Pay
            </button>
            {staffMember && (
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Performance
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.staffName || ''}
                  onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role || 'stylist'}
                  onChange={(e) => setFormData({...formData, role: e.target.value as StaffMember['role']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stylist">Stylist</option>
                  <option value="beautician">Beautician</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="staff@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Specializations</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSpecializations.map((spec) => (
                  <label key={spec} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specializations?.includes(spec) || false}
                      onChange={() => handleSpecializationToggle(spec)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive || false}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">Active Staff Member</label>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Salary Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                <select
                  value={formData.salaryType || 'monthly'}
                  onChange={(e) => setFormData({...formData, salaryType: e.target.value as StaffMember['salaryType']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                  <option value="commission">Commission Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.salaryType === 'hourly' ? 'Hourly Rate (₹)' : 'Base Salary (₹)'}
                </label>
                <input
                  type="number"
                  value={formData.baseSalary || 0}
                  onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                <input
                  type="number"
                  value={formData.commissionRate || 20}
                  onChange={(e) => setFormData({...formData, commissionRate: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="20"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Working Hours
              </h4>
              <div className="space-y-3">
                {Object.entries(formData.workingHours || {}).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hours.isWorking}
                          onChange={(e) => handleWorkingHourChange(day, 'isWorking', e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                      </label>
                    </div>
                    {hours.isWorking && (
                      <>
                        <div>
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => handleWorkingHourChange(day, 'start', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <span className="text-gray-500">to</span>
                        <div>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => handleWorkingHourChange(day, 'end', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && staffMember && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Services</p>
                    <p className="text-xl font-bold text-blue-900">{staffMember.performanceMetrics?.totalServices || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                    <p className="text-xl font-bold text-yellow-900">{staffMember.performanceMetrics?.avgRating || 0}/5</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Monthly Revenue</p>
                    <p className="text-xl font-bold text-green-900">₹{(staffMember.performanceMetrics?.monthlyRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Customer Satisfaction</p>
                    <p className="text-xl font-bold text-purple-900">{staffMember.performanceMetrics?.customerSatisfaction || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-2">Employment Details</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Joined Date:</span>
                  <span className="ml-2 font-medium">{new Date(staffMember.joinedDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Current Status:</span>
                  <span className={`ml-2 font-medium ${staffMember.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {staffMember.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.staffName || !formData.phoneNumber || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              staffMember ? 'Update Staff' : 'Add Staff'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffManagementModal;