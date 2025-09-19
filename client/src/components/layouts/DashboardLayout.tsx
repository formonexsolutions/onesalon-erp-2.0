import { useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { logout } from '../../redux/authSlice';
import {
  HomeIcon, CalendarIcon, CalendarDaysIcon, UsersIcon, CreditCardIcon,
  SparklesIcon, CubeIcon, UserGroupIcon, ChartPieIcon, TruckIcon,
  MegaphoneIcon, StarIcon, BriefcaseIcon, VideoCameraIcon, LifebuoyIcon,
  KeyIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DashboardLayout = () => {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: `/branch/${branchId}/dashboard`, icon: HomeIcon },
    { name: 'Calendar', href: `/branch/${branchId}/calendar`, icon: CalendarIcon },
    { name: 'Appointments', href: `/branch/${branchId}/appointments`, icon: CalendarDaysIcon },
    { name: 'Customers', href: `/branch/${branchId}/customers`, icon: UsersIcon },
    { name: 'Billing', href: `/branch/${branchId}/billing`, icon: CreditCardIcon },
    { name: 'Services', href: `/branch/${branchId}/services`, icon: SparklesIcon },
    { name: 'Inventory', href: `/branch/${branchId}/inventory`, icon: CubeIcon },
    { name: 'Employees', href: `/branch/${branchId}/employees`, icon: UserGroupIcon },
    { name: 'Reports', href: `/branch/${branchId}/reports`, icon: ChartPieIcon },
    { name: 'Marketing', href: `/branch/${branchId}/marketing`, icon: MegaphoneIcon },
    { name: 'Loyalty Programs', href: `/branch/${branchId}/loyalty`, icon: StarIcon },
    { name: 'Distributors', href: `/branch/${branchId}/distributors`, icon: TruckIcon },
    { name: 'Job Portal', href: `/branch/${branchId}/jobs`, icon: BriefcaseIcon },
    { name: 'Training', href: `/branch/${branchId}/training`, icon: VideoCameraIcon },
    { name: 'Support', href: `/branch/${branchId}/support`, icon: LifebuoyIcon },
    { name: 'Permissions', href: `/branch/${branchId}/permissions`, icon: KeyIcon },
    { name: 'Settings', href: `/branch/${branchId}/settings`, icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/api/salons/logout`, {}, { withCredentials: true });
      dispatch(logout());
      navigate('/login');
      toast.success('You have been logged out.');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* --- Sidebar --- */}
      <div className={`flex flex-col bg-white p-4 shadow-lg transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-25'}`}>
        <div className="mb-8 flex items-center justify-center">
            <span className={`text-2xl font-bold text-blue-700 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>OneSalon</span>
        </div>

        <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto pr-2">
          {navigation.map((item) => (
            <div key={item.name} className="relative group">
              <NavLink
                to={item.href}
                end={item.href.endsWith('/dashboard')}
                className={({ isActive }) =>
                  `flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
              </NavLink>

              {/* Tooltip for collapsed view */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-4 -mt-9 hidden whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.name}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* --- Sidebar Toggle and Logout Buttons --- */}
        <div className="pt-4 border-t border-gray-200">
             <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex w-full items-center rounded-md px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
                {isSidebarCollapsed ? (
                    <ChevronDoubleRightIcon className="h-6 w-6" />
                ) : (
                    <ChevronDoubleLeftIcon className="h-6 w-6" />
                )}
                <span className={`ml-3 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : 'block'}`}>Collapse</span>
            </button>
            <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center rounded-md px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-red-100 hover:text-red-700"
            >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                <span className={`ml-3 whitespace-nowrap ${isSidebarCollapsed ? 'hidden' : 'block'}`}>Logout</span>
            </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b bg-white p-4">
          <h1 className="text-xl font-semibold">Welcome!</h1>
           {/* You can add a user profile dropdown here */}
        </header>
        <main className="flex-1 p-2">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;