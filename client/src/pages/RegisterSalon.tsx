import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// --- 1. Validation Schema (No changes needed here) ---
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registrationSchema = z.object({
  salonName: z.string().min(3, 'Salon name must be at least 3 characters'),
  adminName: z.string().min(3, 'Admin name must be at least 3 characters'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number'),
  email: z.string().email('Please enter a valid email address'),
  gst: z.string().regex(/^[0-9A-Z]{15}$/, 'Please enter a valid 15-character GST number').optional().or(z.literal('')),
  password: passwordSchema,
  confirmPassword: z.string(),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  area: z.string().min(1, 'Area is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  timingsFrom: z.string().min(1, 'Opening time is required'),
  timingsTo: z.string().min(1, 'Closing time is required'),
  numberOfChairs: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Number of chairs must be a positive number',
  }),
  holidays: z.array(z.string()).optional(),
  aboutBranch: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegistrationFormInputs = z.infer<typeof registrationSchema>;

// --- 2. Registration Page Component (with input filtering) ---
const RegisterSalon = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<RegistrationFormInputs>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur', // Validate on blur for a better UX
  });
  
  const handleRegistrationSubmit = async (data: RegistrationFormInputs) => {
    setIsLoading(true);
    try {
      // Convert numberOfChairs to number and prepare holidays array
      const submitData = {
        ...data,
        numberOfChairs: Number(data.numberOfChairs),
        holidays: data.holidays || []
      };
      
      await axios.post(`${BASE_URL}/api/salons/register`, submitData);
      toast.success('Registration submitted successfully! Your application is under review.');
      navigate('/login'); // Redirect to login since auto-login is disabled
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[linear-gradient(to_right,rgba(81,108,250,1),rgba(11,28,171,1))] p-12 text-white">
        <h1 className="mb-4 text-4xl font-bold">OneSalon</h1>
        <p className="max-w-md text-center text-lg text-gray-200">
          Join us to get your salon listed, attract more customers, and streamline your operations. Fill out the form to get started!
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(handleRegistrationSubmit)} className="space-y-4">
            <h2 className="text-center text-2xl font-bold text-gray-800">Register Your Salon</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 {/* Salon Name */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">Salon Name</label>
                    <input {...register('salonName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    {errors.salonName && <p className="mt-1 text-xs text-red-600">{errors.salonName.message}</p>}
                 </div>
                 {/* Admin Name */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">Admin Name</label>
                    <input {...register('adminName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    {errors.adminName && <p className="mt-1 text-xs text-red-600">{errors.adminName.message}</p>}
                 </div>
                 {/* Phone Number with Input Filtering */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input 
                      type="tel" 
                      maxLength={10}
                      {...register('phoneNumber')} 
                      // ✅ ADDED THIS: Instantly removes non-numeric characters on input
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
                 </div>
                 {/* GST Number with Input Filtering */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">GST Number (Optional)</label>
                    <input 
                      maxLength={15}
                      {...register('gst')} 
                      // ✅ ADDED THIS: Instantly removes invalid characters and converts to uppercase
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.gst && <p className="mt-1 text-xs text-red-600">{errors.gst.message}</p>}
                 </div>
                 {/* Password */}
                 <div className="relative">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <input type={showPassword ? 'text' : 'password'} {...register('password')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500">
                        {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                    </button>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                 </div>
                 {/* Confirm Password */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                    <input type={showPassword ? 'text' : 'password'} {...register('confirmPassword')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                 </div>
                 {/* State */}
                 <div>
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <input {...register('state')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
                 </div>
                 {/* City */} 
                 <div>
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <input {...register('city')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                    {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                 </div>
                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea {...register('address')} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                  {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50">
              {isLoading ? 'Registering...' : 'Register'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account? <Link to="/LoginPage" className="font-medium text-blue-600 hover:text-blue-500">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterSalon;