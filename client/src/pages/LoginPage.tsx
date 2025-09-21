import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { login } from '../redux/authSlice';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumberForOtp, setPhoneNumberForOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);

  const intervalRef = useRef<number | undefined>();

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (otpSent && timer > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [otpSent, timer]);

  const passwordForm = useForm();
  const otpForm = useForm();

  const onPasswordLogin = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/salons/login/password`, data);
      const userData = response.data;
      dispatch(login({ user: userData, token: 'from_cookie' }));
      toast.success('Login successful!');
      
      // Redirect based on user role
      if (userData.role === 'salonadmin') {
        navigate('/dashboard');
      } else if (userData.role === 'stylist') {
        navigate('/stylist-dashboard');
      } else if (userData.role === 'receptionist') {
        navigate('/receptionist-dashboard');
      } else if (userData.role === 'manager') {
        navigate('/manager-dashboard');
      } else {
        // Default fallback
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSendOtp = async (data: any) => {
    setIsLoading(true);
    setPhoneNumberForOtp(data.phoneNumber);
    try {
      await axios.post(`${BASE_URL}/api/salons/login/send-otp`, { phoneNumber: data.phoneNumber });
      toast.success('OTP sent to your phone.');
      setOtpSent(true);
      setTimer(30);
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onVerifyOtp = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/salons/login/verify-otp`, {
        phoneNumber: phoneNumberForOtp,
        otp: data.otp,
      });
      const userData = response.data;
      dispatch(login({ user: userData, token: 'from_cookie' }));
      toast.success('Login successful!');
      
      // Redirect based on user role
      if (userData.role === 'salonadmin') {
        navigate('/dashboard');
      } else if (userData.role === 'stylist') {
        navigate('/stylist-dashboard');
      } else if (userData.role === 'receptionist') {
        navigate('/receptionist-dashboard');
      } else if (userData.role === 'manager') {
        navigate('/manager-dashboard');
      } else {
        // Default fallback
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordForm = () => (
    <form className="mt-8 space-y-6" onSubmit={passwordForm.handleSubmit(onPasswordLogin)}>
      <div className="space-y-4">
        <div>
          <input
            type="tel"
            placeholder="Mobile Number"
            {...passwordForm.register('phoneNumber', { required: 'Phone number is required' })}
            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          />
          {passwordForm.formState.errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{String(passwordForm.formState.errors.phoneNumber.message)}</p>}
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            {...passwordForm.register('password', { required: 'Password is required' })}
            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
            {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
          </button>
          {passwordForm.formState.errors.password && <p className="mt-1 text-xs text-red-600">{String(passwordForm.formState.errors.password.message)}</p>}
        </div>
      </div>
      <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
        {isLoading ? 'Signing in...' : 'Login'}
      </button>
    </form>
  );

  const renderOtpForm = () => {
    if (!otpSent) {
      return (
        <form className="mt-8 space-y-6" onSubmit={otpForm.handleSubmit(onSendOtp)}>
          <input
            type="tel"
            placeholder="Enter your mobile number"
            {...otpForm.register('phoneNumber', { required: 'Phone number is required' })}
            className="block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          />
          {otpForm.formState.errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{String(otpForm.formState.errors.phoneNumber.message)}</p>}
          <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      );
    } else {
      return (
        <form className="mt-8 space-y-6" onSubmit={otpForm.handleSubmit(onVerifyOtp)}>
           <p className="text-center text-sm text-gray-600">An OTP was sent to {phoneNumberForOtp}.</p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            {...otpForm.register('otp', { required: 'OTP is required' })}
            className="block w-full rounded-md border-0 py-2.5 px-3 text-center text-lg tracking-widest text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          />
          {otpForm.formState.errors.otp && <p className="mt-1 text-xs text-red-600">{String(otpForm.formState.errors.otp.message)}</p>}
          <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-md bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50">
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <div className="text-center text-sm">
            {timer > 0 ? (
              <p className="text-gray-500">Resend OTP in {timer}s</p>
            ) : (
              <button
                type="button"
                onClick={() => onSendOtp({ phoneNumber: phoneNumberForOtp })}
                className="font-medium text-blue-600 hover:text-blue-500"
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </div>
        </form>
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-2xl font-bold text-gray-800">
          Salon Admin & Staff Login
        </h2>

        <div className="mt-6 border-b border-gray-200">
          <div className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => { setLoginMethod('password'); setOtpSent(false); }}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                loginMethod === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => { setLoginMethod('otp'); setOtpSent(false); }}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                loginMethod === 'otp'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              OTP
            </button>
          </div>
        </div>

        {loginMethod === 'password' ? renderPasswordForm() : renderOtpForm()}

        <p className="mt-8 text-center text-sm text-gray-600">
          Want to register your salon?{' '}
          <Link to="/RegisterSalon" className="font-medium text-blue-600 hover:text-blue-500">
            Click here.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;