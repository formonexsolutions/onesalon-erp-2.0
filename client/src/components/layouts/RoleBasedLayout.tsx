import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/authSlice';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['salonadmin'] },
  { name: 'Dashboard', href: '/stylist-dashboard', icon: HomeIcon, roles: ['stylist'] },
  { name: 'Dashboard', href: '/receptionist-dashboard', icon: HomeIcon, roles: ['receptionist'] },
  { name: 'Dashboard', href: '/manager-dashboard', icon: HomeIcon, roles: ['manager'] },
  { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, roles: ['salonadmin', 'receptionist', 'manager'] },
  { name: 'Appointments', href: '/appointments', icon: ClockIcon, roles: ['stylist', 'receptionist', 'manager'] },
  { name: 'Customers', href: '/customers', icon: UsersIcon, roles: ['salonadmin', 'receptionist', 'manager'] },
  { name: 'Staff Management', href: '/staff', icon: UserIcon, roles: ['salonadmin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['salonadmin', 'manager'] },
  { name: 'Financial', href: '/financial', icon: CurrencyDollarIcon, roles: ['salonadmin', 'manager'] },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['salonadmin'] },
];

const RoleBasedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSelector(selectAuth);
  const location = useLocation();

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'salonadmin': return 'Salon Management';
      case 'stylist': return 'Stylist Portal';
      case 'receptionist': return 'Reception Desk';
      case 'manager': return 'Manager Console';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">OneSalon</h1>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              <div className="mb-4 px-3">
                <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {getDashboardTitle()}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Welcome, {user?.name}</p>
              </div>
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;