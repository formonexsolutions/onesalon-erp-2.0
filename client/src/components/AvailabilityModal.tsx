import { useState } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (availability: any) => void;
  currentAvailability?: any;
}

const AvailabilityModal = ({ isOpen, onClose, onSave, currentAvailability }: AvailabilityModalProps) => {
  const [availability, setAvailability] = useState(currentAvailability || {
    monday: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    thursday: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    friday: { enabled: true, startTime: '09:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
    saturday: { enabled: true, startTime: '10:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
    sunday: { enabled: false, startTime: '10:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00' }
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleDayChange = (day: string, field: string, value: any) => {
    setAvailability((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(availability);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClockIcon className="h-6 w-6 mr-2 text-blue-600" />
            Update Availability
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {days.map((day, index) => (
            <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 w-24">
                <input
                  type="checkbox"
                  checked={availability[day].enabled}
                  onChange={(e) => handleDayChange(day, 'enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="font-medium text-gray-700">{dayLabels[index]}</label>
              </div>
              
              {availability[day].enabled && (
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Start:</label>
                    <input
                      type="time"
                      value={availability[day].startTime}
                      onChange={(e) => handleDayChange(day, 'startTime', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">End:</label>
                    <input
                      type="time"
                      value={availability[day].endTime}
                      onChange={(e) => handleDayChange(day, 'endTime', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Break:</label>
                    <input
                      type="time"
                      value={availability[day].breakStart}
                      onChange={(e) => handleDayChange(day, 'breakStart', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      value={availability[day].breakEnd}
                      onChange={(e) => handleDayChange(day, 'breakEnd', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;