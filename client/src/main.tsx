import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';

// Core Components & Layouts
import App from './App';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layouts/DashboardLayout';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterSalon from './pages/RegisterSalon';
import SalonDashboard from './pages/SalonDashboard';
import StylistDashboard from './pages/StylistDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Appointments from './pages/Appointments';
import Inventory from './pages/Inventory';
import Staff from './pages/Staff';
import Financial from './pages/Financial';

// Super Admin Components
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SalonRequests from './pages/SalonRequests';
import ExistingSalons from './pages/ExistingSalons';

// Error Pages
import UnauthorizedPage from './pages/UnauthorizedPage';
import Error404 from './pages/Error404';

import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Error404 />,
    children: [
      // --- Public Routes ---
      { index: true, element: <HomePage /> },
      { path: 'LoginPage', element: <LoginPage /> },
      { path: 'RegisterSalon', element: <RegisterSalon /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },

      // --- Super Admin Routes ---
      { path: 'super-admin/login', element: <SuperAdminLogin /> },
      
      // Protected Super Admin Routes
      {
        path: 'super-admin',
        element: <ProtectedRoute allowedRoles={['superadmin']} />,
        children: [
          { path: 'dashboard', element: <SuperAdminDashboard /> },
          { path: 'salon-requests', element: <SalonRequests /> },
          { path: 'existing-salons', element: <ExistingSalons /> },
        ],
      },

      // --- Protected Routes for Salon Admin and Staff ---
      {
        element: <ProtectedRoute allowedRoles={['salonadmin']} />,
        children: [
          {
            path: 'dashboard', // Salon Admin Dashboard
            element: <SalonDashboard />,
          },
          {
            path: 'branch/:branchId', // Routes for a specific branch
            element: <DashboardLayout />,
            children: [
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'calendar', element: <Calendar /> },
              { path: 'appointments', element: <Appointments /> },
              { path: 'customers', element: <Customers /> },
              { path: 'services', element: <Services /> },
              { path: 'inventory', element: <Inventory /> },
              { path: 'staff', element: <Staff /> },
              { path: 'financial', element: <Financial /> },
            ],
          },
        ],
      },

      // --- Protected Routes for Stylists ---
      {
        element: <ProtectedRoute allowedRoles={['stylist']} />,
        children: [
          {
            path: 'stylist-dashboard',
            element: <StylistDashboard />,
          },
        ],
      },

      // --- Protected Routes for Receptionists ---
      {
        element: <ProtectedRoute allowedRoles={['receptionist']} />,
        children: [
          {
            path: 'receptionist-dashboard',
            element: <ReceptionistDashboard />,
          },
        ],
      },

      // --- Protected Routes for Managers ---
      {
        element: <ProtectedRoute allowedRoles={['manager']} />,
        children: [
          {
            path: 'manager-dashboard',
            element: <ManagerDashboard />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider 
        router={router} 
        future={{
          v7_startTransition: true
        }}
      />
    </Provider>
  </React.StrictMode>
);