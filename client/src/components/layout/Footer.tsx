import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-lg font-bold text-green-600">VanLifeToolBox</span>
            <p className="mt-2 text-sm text-gray-600">
              Tools for nomads, van lifers, RVers, and road travelers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Features
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/weather" className="text-sm text-gray-600 hover:text-green-600">
                  Weather Finder
                </Link>
              </li>
              <li>
                <Link to="/calculators" className="text-sm text-gray-600 hover:text-green-600">
                  Electrical Calculators
                </Link>
              </li>
              <li>
                <Link to="/resources" className="text-sm text-gray-600 hover:text-green-600">
                  Resource Library
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Account
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/login" className="text-sm text-gray-600 hover:text-green-600">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-gray-600 hover:text-green-600">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-green-600">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            &copy; {currentYear} VanLifeToolBox. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
