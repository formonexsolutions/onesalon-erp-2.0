import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectAuth } from '../redux/authSlice';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // e.g., ['admin', 'dealer', 'superadmin']
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector(selectAuth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Determine redirect path based on the current route
    const isSupeAdminRoute = location.pathname.startsWith('/super-admin');
    const redirectTo = isSupeAdminRoute ? '/super-admin/login' : '/LoginPage';
    
    // Redirect them to the appropriate login page, but save the current location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If allowedRoles are specified, check if the user's role is included
  const isAuthorized = allowedRoles ? allowedRoles.includes(user?.role ?? '') : true;

  return isAuthorized ? (
    <Outlet /> // If authorized, render the child routes
  ) : (
    <Navigate to="/unauthorized" replace /> // Or redirect to an "Unauthorized" page
  );
};

export default ProtectedRoute;