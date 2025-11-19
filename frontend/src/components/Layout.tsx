import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Review', href: '/review', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-nav transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/40 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/50">
              <Briefcase className="h-5 w-5 text-gray-800" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">HireScan</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-700 hover:text-gray-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-white/40 backdrop-blur-md text-gray-800 font-medium shadow-lg border border-white/50'
                    : 'text-gray-700 hover:bg-white/20 hover:text-gray-900 border border-transparent'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="px-4 py-4 border-t border-white/20 flex-shrink-0">
          <div className="mb-3 px-4 py-2 text-sm">
            {user?.first_name || user?.last_name ? (
              <div>
                <div className="font-medium text-gray-800">
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">{user.email}</div>
              </div>
            ) : (
              <div className="font-medium text-gray-800">{user?.email}</div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-white/20 hover:text-gray-900 transition-all border border-transparent hover:border-white/30"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-nav border-b border-white/20 h-16 flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/40 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/50">
              <Briefcase className="h-5 w-5 text-gray-800" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">HireScan</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-gray-700 hover:text-gray-900 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="pt-16 lg:pt-0 min-h-full">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

