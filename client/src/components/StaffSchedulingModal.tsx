import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarDaysIcon, UserIcon, ClockIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StaffSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Staff {
  _id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  availability: {
    monday: { isAvailable: boolean; startTime: string; endTime: string; };
    tuesday: { isAvailable: boolean; startTime: string; endTime: string; };
    wednesday: { isAvailable: boolean; startTime: string; endTime: string; };
    thursday: { isAvailable: boolean; startTime: string; endTime: string; };
    friday: { isAvailable: boolean; startTime: string; endTime: string; };
    saturday: { isAvailable: boolean; startTime: string; endTime: string; };
    sunday: { isAvailable: boolean; startTime: string; endTime: string; };
  };
}

interface ScheduleEntry {
  _id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'regular' | 'overtime' | 'holiday';
}

const StaffSchedulingModal = ({ isOpen, onClose }: StaffSchedulingModalProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showAddScheduleForm, setShowAddScheduleForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [newSchedule, setNewSchedule] = useState({
    staffId: '',
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    type: 'regular' as ScheduleEntry['type']
  });

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      fetchSchedules();
    }
  }, [isOpen, selectedWeek]);

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/staff`, {
        withCredentials: true
      });
      setStaff(response.data.staff || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      // Mock data for demonstration
      const mockStaff = [
        {
          _id: '1',
          name: 'Priya Sharma',
          role: 'Senior Stylist',
          email: 'priya@onesalon.com',
          phone: '+91 98765 43210',
          availability: {
            monday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            tuesday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            wednesday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            thursday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            friday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            saturday: { isAvailable: true, startTime: '10:00', endTime: '19:00' },
            sunday: { isAvailable: false, startTime: '', endTime: '' }
          }
        },
        {
          _id: '2',
          name: 'Rahul Patel',
          role: 'Hair Specialist',
          email: 'rahul@onesalon.com',
          phone: '+91 87654 32109',
          availability: {
            monday: { isAvailable: true, startTime: '10:00', endTime: '19:00' },
            tuesday: { isAvailable: false, startTime: '', endTime: '' },
            wednesday: { isAvailable: true, startTime: '10:00', endTime: '19:00' },
            thursday: { isAvailable: true, startTime: '10:00', endTime: '19:00' },
            friday: { isAvailable: true, startTime: '10:00', endTime: '19:00' },
            saturday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            sunday: { isAvailable: true, startTime: '11:00', endTime: '17:00' }
          }
        },
        {
          _id: '3',
          name: 'Anjali Verma',
          role: 'Receptionist',
          email: 'anjali@onesalon.com',
          phone: '+91 76543 21098',
          availability: {
            monday: { isAvailable: true, startTime: '08:30', endTime: '17:30' },
            tuesday: { isAvailable: true, startTime: '08:30', endTime: '17:30' },
            wednesday: { isAvailable: true, startTime: '08:30', endTime: '17:30' },
            thursday: { isAvailable: true, startTime: '08:30', endTime: '17:30' },
            friday: { isAvailable: true, startTime: '08:30', endTime: '17:30' },
            saturday: { isAvailable: true, startTime: '09:00', endTime: '18:00' },
            sunday: { isAvailable: false, startTime: '', endTime: '' }
          }
        }
      ];
      setStaff(mockStaff);
    }
  };

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const startDate = getWeekStart(selectedWeek);
      
      const response = await axios.get(`${BASE_URL}/api/schedule/weekly`, {
        params: { startDate: startDate.toISOString() },
        withCredentials: true
      });
      setSchedules(response.data.weeklySchedule || []);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
      // Mock data for demonstration
      const mockSchedules = [
        {
          _id: '1',
          staffId: '1',
          staffName: 'Priya Sharma',
          date: '2025-01-15',
          startTime: '09:00',
          endTime: '18:00',
          role: 'Senior Stylist',
          status: 'scheduled' as const,
          type: 'regular' as const
        },
        {
          _id: '2',
          staffId: '2',
          staffName: 'Rahul Patel',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '19:00',
          role: 'Hair Specialist',
          status: 'scheduled' as const,
          type: 'regular' as const
        },
        {
          _id: '3',
          staffId: '3',
          staffName: 'Anjali Verma',
          date: '2025-01-15',
          startTime: '08:30',
          endTime: '17:30',
          role: 'Receptionist',
          status: 'scheduled' as const,
          type: 'regular' as const
        },
        {
          _id: '4',
          staffId: '1',
          staffName: 'Priya Sharma',
          date: '2025-01-16',
          startTime: '09:00',
          endTime: '20:00',
          role: 'Senior Stylist',
          status: 'scheduled' as const,
          type: 'overtime' as const
        }
      ];
      setSchedules(mockSchedules);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(start.setDate(diff));
  };

  const getWeekDays = () => {
    const start = getWeekStart(selectedWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const handleAddSchedule = async () => {
    try {
      const staffMember = staff.find(s => s._id === newSchedule.staffId);
      if (!staffMember) return;

      const scheduleData = {
        ...newSchedule,
        staffName: staffMember.name,
        role: staffMember.role,
        status: 'scheduled'
      };

      const response = await axios.post(`${BASE_URL}/api/schedule/shifts`, scheduleData, {
        withCredentials: true
      });

      setSchedules([...schedules, response.data.schedule]);
      setShowAddScheduleForm(false);
      resetNewSchedule();
    } catch (error) {
      console.error('Failed to add schedule:', error);
      // For demo, add schedule locally
      const staffMember = staff.find(s => s._id === newSchedule.staffId);
      if (staffMember) {
        const mockSchedule = {
          _id: Date.now().toString(),
          ...newSchedule,
          staffName: staffMember.name,
          role: staffMember.role,
          status: 'scheduled' as const
        };
        setSchedules([...schedules, mockSchedule]);
        setShowAddScheduleForm(false);
        resetNewSchedule();
      }
    }
  };

  const resetNewSchedule = () => {
    setNewSchedule({
      staffId: '',
      date: '',
      startTime: '09:00',
      endTime: '18:00',
      type: 'regular'
    });
  };

  const getSchedulesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.date === dateStr);
  };

  const getSchedulesForStaff = (staffId: string) => {
    return schedules.filter(schedule => schedule.staffId === staffId);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      regular: 'bg-blue-100 text-blue-800',
      overtime: 'bg-orange-100 text-orange-800',
      holiday: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-600" />
            Staff Scheduling
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'week' | 'month')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week of</label>
              <input
                type="date"
                value={selectedWeek.toISOString().split('T')[0]}
                onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {selectedStaff && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Staff</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Staff</option>
                  {staff.map(member => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAddScheduleForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Schedule
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedules...</p>
          </div>
        ) : viewMode === 'week' ? (
          /* Week View */
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="grid grid-cols-8 gap-px bg-gray-200">
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff
              </div>
              {getWeekDays().map((day, index) => (
                <div key={index} className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {formatDate(day)}
                </div>
              ))}
              
              {/* Staff Rows */}
              {staff.map((member) => (
                <React.Fragment key={member._id}>
                  <div className="bg-white px-4 py-4 border-r border-gray-200">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                  </div>
                  {getWeekDays().map((day, dayIndex) => {
                    const daySchedules = getSchedulesForDay(day).filter(s => s.staffId === member._id);
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const dayName = dayNames[day.getDay()] as keyof typeof member.availability;
                    const availability = member.availability[dayName];
                    
                    return (
                      <div key={dayIndex} className="bg-white px-2 py-2 min-h-[100px]">
                        {availability.isAvailable && (
                          <div className="text-xs text-gray-500 mb-2">
                            {availability.startTime} - {availability.endTime}
                          </div>
                        )}
                        {daySchedules.map((schedule) => (
                          <div key={schedule._id} className="mb-2">
                            <div className={`text-xs px-2 py-1 rounded ${getTypeColor(schedule.type)}`}>
                              <div className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              <div className={`mt-1 text-xs px-1 py-0.5 rounded ${getStatusColor(schedule.status)}`}>
                                {schedule.status}
                              </div>
                            </div>
                          </div>
                        ))}
                        {!availability.isAvailable && (
                          <div className="text-xs text-gray-400 italic">Unavailable</div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          /* Staff List View */
          <div className="space-y-6">
            {staff.map((member) => {
              const memberSchedules = getSchedulesForStaff(member._id);
              return (
                <div key={member._id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Upcoming Schedules</h5>
                      <div className="space-y-2">
                        {memberSchedules.slice(0, 3).map((schedule) => (
                          <div key={schedule._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="text-sm font-medium">{new Date(schedule.date).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{schedule.startTime} - {schedule.endTime}</div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(schedule.type)}`}>
                              {schedule.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Weekly Availability</h5>
                      <div className="space-y-1">
                        {Object.entries(member.availability).map(([day, avail]) => (
                          <div key={day} className="flex justify-between text-sm">
                            <span className="capitalize">{day}</span>
                            <span className={avail.isAvailable ? 'text-green-600' : 'text-red-600'}>
                              {avail.isAvailable ? `${avail.startTime} - ${avail.endTime}` : 'Not Available'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Schedule Form */}
        {showAddScheduleForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Schedule</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                  <select
                    value={newSchedule.staffId}
                    onChange={(e) => setNewSchedule({...newSchedule, staffId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(member => (
                      <option key={member._id} value={member._id}>{member.name} - {member.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Type</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value as ScheduleEntry['type']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="overtime">Overtime</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddScheduleForm(false);
                    resetNewSchedule();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSchedule}
                  disabled={!newSchedule.staffId || !newSchedule.date}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Schedule
                </button>
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

export default StaffSchedulingModal;