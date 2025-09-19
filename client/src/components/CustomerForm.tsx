import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: Customer | null;
}

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormInputs = z.infer<typeof customerSchema>;

const CustomerForm = ({ isOpen, onClose, onSuccess, customerToEdit }: CustomerFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerSchema),
  });

  const isEditMode = !!customerToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            reset(customerToEdit);
        } else {
            reset({ name: '', phoneNumber: '', email: '', address: '', notes: '' });
        }
    }
  }, [isOpen, customerToEdit, reset, isEditMode]);

  const onSubmit = async (data: CustomerFormInputs) => {
    try {
      if (isEditMode) {
        await axios.put(`/api/customers/${customerToEdit?._id}`, data);
        toast.success('Customer updated successfully!');
      } else {
        await axios.post('/api/customers', data);
        toast.success('Customer added successfully!');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'An error occurred.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6"/>
        </button>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Customer' : 'Add New Customer'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          
          <input {...register('name')} placeholder="Full Name" className="w-full rounded-md border p-2"/>
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}

          <input {...register('phoneNumber')} placeholder="Phone Number" className="w-full rounded-md border p-2"/>
          {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
          
          {/* --- ADDED THIS FIELD --- */}
          <input {...register('email')} placeholder="Email Address (Optional)" className="w-full rounded-md border p-2"/>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          
          {/* --- ADDED THIS FIELD --- */}
          <input {...register('address')} placeholder="Address (Optional)" className="w-full rounded-md border p-2"/>
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          
          {/* --- ADDED THIS FIELD --- */}
          <textarea {...register('notes')} placeholder="Notes (e.g., allergies, preferences)" className="w-full rounded-md border p-2" rows={3}/>
          {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
          
          <div className="mt-6 flex justify-end gap-x-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              {isEditMode ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;