import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });
  
  const handleLoginSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/super-admin/login`, data, {
        withCredentials: true
      });
      
      toast.success('Login successful!');
      navigate('/super-admin/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[linear-gradient(to_right,rgba(81,108,250,1),rgba(11,28,171,1))] p-12 text-white">
        <h1 className="mb-4 text-4xl font-bold">OneSalon</h1>
        <h2 className="mb-4 text-2xl font-semibold">Super Admin Portal</h2>
        <p className="max-w-md text-center text-lg text-gray-200">
          Manage salon registrations, approvals, and oversee the entire OneSalon ecosystem.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800">Super Admin Login</h2>
              <p className="mt-2 text-gray-600">Access the admin dashboard</p>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email"
                {...register('email')} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                placeholder="admin@onesalon.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                {...register('password')} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                placeholder="Enter your password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
              </button>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isLoading} 
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Default credentials: admin@onesalon.com / Admin@123456
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;