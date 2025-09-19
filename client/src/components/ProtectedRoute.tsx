import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectAuth } from '../redux/authSlice';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // e.g., ['admin', 'dealer']
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector(selectAuth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them back after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
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