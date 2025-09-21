import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

// Validation now includes all editable fields
const branchSchema = z.object({
  branchName: z.string().min(3, 'Branch name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  // Status is no longer edited in this form
});

type BranchFormInputs = z.infer<typeof branchSchema>;

interface Branch {
  _id: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  status: 'active' | 'inactive';
}

interface EditBranchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branch: Branch | null;
}

const EditBranchForm = ({ isOpen, onClose, onSuccess, branch }: EditBranchFormProps) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BranchFormInputs>();

  useEffect(() => {
    if (branch) {
      reset(branch); // Pre-populates the form with all branch data
    }
  }, [branch, reset]);

  const onSubmit = async (data: BranchFormInputs) => {
    if (!branch) return;
    try {
      await axios.put(`/api/branches/${branch._id}`, data, { withCredentials: true });
      toast.success('Branch updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to update branch.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6"/>
        </button>
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Edit Branch Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Branch Name</label>
              <input {...register('branchName')} className="mt-1 w-full rounded-md border p-2"/>
              {errors.branchName && <p className="text-xs text-red-500">{errors.branchName.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <input {...register('address')} className="mt-1 w-full rounded-md border p-2"/>
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input {...register('city')} className="mt-1 w-full rounded-md border p-2"/>
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <input {...register('state')} className="mt-1 w-full rounded-md border p-2"/>
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
             <div className="sm:col-span-2">
              <label className="text-sm font-medium">Branch Phone Number</label>
              <input {...register('phoneNumber')} className="mt-1 w-full rounded-md border p-2"/>
              {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-x-4 pt-4">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBranchForm;