import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in to access your dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            Save your weather searches and electrical configurations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-6 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Saved Searches */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Saved Searches</h2>
            <Link
              to="/weather"
              className="text-sm text-green-600 hover:text-green-700"
            >
              New Search
            </Link>
          </div>
          <div className="text-gray-500 text-center py-8">
            <p>No saved searches yet.</p>
            <Link
              to="/weather"
              className="mt-2 inline-block text-green-600 hover:text-green-700"
            >
              Create your first search
            </Link>
          </div>
          {/* TODO: SavedSearchesList component */}
        </div>

        {/* Electrical Configurations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Electrical Configurations</h2>
            <Link
              to="/calculators"
              className="text-sm text-green-600 hover:text-green-700"
            >
              New Config
            </Link>
          </div>
          <div className="text-gray-500 text-center py-8">
            <p>No saved configurations yet.</p>
            <Link
              to="/calculators"
              className="mt-2 inline-block text-green-600 hover:text-green-700"
            >
              Create your first configuration
            </Link>
          </div>
          {/* TODO: ConfigurationsList component */}
        </div>
      </div>
    </div>
  );
}
