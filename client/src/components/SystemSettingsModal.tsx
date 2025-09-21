import { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon, BellIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemSettings {
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean; };
    tuesday: { open: string; close: string; isOpen: boolean; };
    wednesday: { open: string; close: string; isOpen: boolean; };
    thursday: { open: string; close: string; isOpen: boolean; };
    friday: { open: string; close: string; isOpen: boolean; };
    saturday: { open: string; close: string; isOpen: boolean; };
    sunday: { open: string; close: string; isOpen: boolean; };
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    lowStockAlerts: boolean;
    staffUpdates: boolean;
  };
  appointment: {
    bookingWindowDays: number;
    cancellationPolicyHours: number;
    noShowPolicyEnabled: boolean;
    reminderTimeHours: number;
    bufferTimeBetweenAppointments: number;
  };
  payments: {
    acceptCash: boolean;
    acceptCard: boolean;
    acceptUPI: boolean;
    advancePaymentPercentage: number;
    refundPolicyDays: number;
  };
  staff: {
    commissionRates: {
      stylist: number;
      colorist: number;
      therapist: number;
    };
    overtimeRateMultiplier: number;
    maximumWorkingHoursPerDay: number;
  };
  security: {
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    dataRetentionDays: number;
  };
}

const SystemSettingsModal = ({ isOpen, onClose }: SystemSettingsModalProps) => {
  const [settings, setSettings] = useState<SystemSettings>({
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '10:00', close: '19:00', isOpen: true },
      sunday: { open: '11:00', close: '17:00', isOpen: false }
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      appointmentReminders: true,
      lowStockAlerts: true,
      staffUpdates: true
    },
    appointment: {
      bookingWindowDays: 30,
      cancellationPolicyHours: 24,
      noShowPolicyEnabled: true,
      reminderTimeHours: 24,
      bufferTimeBetweenAppointments: 15
    },
    payments: {
      acceptCash: true,
      acceptCard: true,
      acceptUPI: true,
      advancePaymentPercentage: 25,
      refundPolicyDays: 7
    },
    staff: {
      commissionRates: {
        stylist: 40,
        colorist: 45,
        therapist: 35
      },
      overtimeRateMultiplier: 1.5,
      maximumWorkingHoursPerDay: 10
    },
    security: {
      sessionTimeoutMinutes: 120,
      passwordMinLength: 8,
      requireTwoFactor: false,
      dataRetentionDays: 1095
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'notifications' | 'appointments' | 'payments' | 'staff' | 'security'>('business');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/settings`, {
        withCredentials: true
      });
      setSettings(response.data.settings || settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Using default settings as fallback
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await axios.put(`${BASE_URL}/api/admin/settings`, settings, {
        withCredentials: true
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusinessHours = (day: keyof typeof settings.businessHours, field: keyof typeof settings.businessHours.monday, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const updateNotifications = (key: keyof typeof settings.notifications, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const updateAppointmentSettings = (key: keyof typeof settings.appointment, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      appointment: {
        ...prev.appointment,
        [key]: value
      }
    }));
  };

  const updatePaymentSettings = (key: keyof typeof settings.payments, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        [key]: value
      }
    }));
  };

  const updateStaffSettings = (key: keyof typeof settings.staff, value: number | object) => {
    setSettings(prev => ({
      ...prev,
      staff: {
        ...prev.staff,
        [key]: value
      }
    }));
  };

  const updateSecuritySettings = (key: keyof typeof settings.security, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'business', name: 'Business Hours', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appointments', name: 'Appointments', icon: Cog6ToothIcon },
    { id: 'payments', name: 'Payments', icon: Cog6ToothIcon },
    { id: 'staff', name: 'Staff', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Cog6ToothIcon className="h-6 w-6 mr-2 text-blue-600" />
            System Settings
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <div className="flex">
            {/* Tab Navigation */}
            <div className="w-1/4 pr-6">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="w-3/4 pl-6 border-l border-gray-200">
              {/* Business Hours Tab */}
              {activeTab === 'business' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h4>
                  <div className="space-y-4">
                    {Object.entries(settings.businessHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4">
                        <div className="w-24">
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          onChange={(e) => updateBusinessHours(day as keyof typeof settings.businessHours, 'isOpen', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">Open</span>
                        {hours.isOpen && (
                          <>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateBusinessHours(day as keyof typeof settings.businessHours, 'open', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateBusinessHours(day as keyof typeof settings.businessHours, 'close', e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h4>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                        </div>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateNotifications(key as keyof typeof settings.notifications, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Appointment Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Booking Window (Days)</label>
                      <input
                        type="number"
                        value={settings.appointment.bookingWindowDays}
                        onChange={(e) => updateAppointmentSettings('bookingWindowDays', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy (Hours)</label>
                      <input
                        type="number"
                        value={settings.appointment.cancellationPolicyHours}
                        onChange={(e) => updateAppointmentSettings('cancellationPolicyHours', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Time (Hours)</label>
                      <input
                        type="number"
                        value={settings.appointment.reminderTimeHours}
                        onChange={(e) => updateAppointmentSettings('reminderTimeHours', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time Between Appointments (Minutes)</label>
                      <input
                        type="number"
                        value={settings.appointment.bufferTimeBetweenAppointments}
                        onChange={(e) => updateAppointmentSettings('bufferTimeBetweenAppointments', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.appointment.noShowPolicyEnabled}
                        onChange={(e) => updateAppointmentSettings('noShowPolicyEnabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Enable No-Show Policy</label>
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.payments.acceptCash}
                          onChange={(e) => updatePaymentSettings('acceptCash', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Accept Cash</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.payments.acceptCard}
                          onChange={(e) => updatePaymentSettings('acceptCard', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Accept Card</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.payments.acceptUPI}
                          onChange={(e) => updatePaymentSettings('acceptUPI', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Accept UPI</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment Percentage</label>
                      <input
                        type="number"
                        value={settings.payments.advancePaymentPercentage}
                        onChange={(e) => updatePaymentSettings('advancePaymentPercentage', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Refund Policy (Days)</label>
                      <input
                        type="number"
                        value={settings.payments.refundPolicyDays}
                        onChange={(e) => updatePaymentSettings('refundPolicyDays', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Tab */}
              {activeTab === 'staff' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Staff Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Commission Rates (%)</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Stylist</label>
                          <input
                            type="number"
                            value={settings.staff.commissionRates.stylist}
                            onChange={(e) => updateStaffSettings('commissionRates', {
                              ...settings.staff.commissionRates,
                              stylist: Number(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Colorist</label>
                          <input
                            type="number"
                            value={settings.staff.commissionRates.colorist}
                            onChange={(e) => updateStaffSettings('commissionRates', {
                              ...settings.staff.commissionRates,
                              colorist: Number(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Therapist</label>
                          <input
                            type="number"
                            value={settings.staff.commissionRates.therapist}
                            onChange={(e) => updateStaffSettings('commissionRates', {
                              ...settings.staff.commissionRates,
                              therapist: Number(e.target.value)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.staff.overtimeRateMultiplier}
                        onChange={(e) => updateStaffSettings('overtimeRateMultiplier', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Working Hours Per Day</label>
                      <input
                        type="number"
                        value={settings.staff.maximumWorkingHoursPerDay}
                        onChange={(e) => updateStaffSettings('maximumWorkingHoursPerDay', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (Minutes)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeoutMinutes}
                        onChange={(e) => updateSecuritySettings('sessionTimeoutMinutes', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Password Length</label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSecuritySettings('passwordMinLength', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention (Days)</label>
                      <input
                        type="number"
                        value={settings.security.dataRetentionDays}
                        onChange={(e) => updateSecuritySettings('dataRetentionDays', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.requireTwoFactor}
                        onChange={(e) => updateSecuritySettings('requireTwoFactor', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Require Two-Factor Authentication</label>
                    </div>
                  </div>
                </div>
              )}
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
            onClick={saveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsModal;