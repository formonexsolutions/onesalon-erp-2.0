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
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Customers from './pages/Customers';
// import Appointments from './pages/Appointments';
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

      // --- Protected Routes for Salon Admin ---
      {
        element: <ProtectedRoute allowedRoles={['salonadmin']} />,
        children: [
          {
            path: 'dashboard', // Main salon dashboard for managing branches
            element: <SalonDashboard />,
          },
          {
            path: 'branch/:branchId', // Routes for a specific branch
            element: <DashboardLayout />,
            children: [
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'calendar', element: <Calendar /> },
              { path: 'customers', element: <Customers /> },

              // { path: 'appointments', element: <Appointments /> },
            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);