import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that protects routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 * Preserves the intended destination in location state for redirect after login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isSupabaseConfigured } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase is not configured, show a message
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Not Available</h1>
          <p className="text-gray-600">
            This feature requires authentication, which is not currently configured.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
