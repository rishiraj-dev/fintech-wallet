import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, User, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('logout failed:', error);
        showToast('Logout failed', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-6 lg:pl-20">
      {/* header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 lg:-ml-20">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:pl-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* user profile */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-[#C5FF55] to-[#a3d948] rounded-full flex items-center justify-center">
              <User size={32} className="text-gray-900" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </Card>

        {/* appearance */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Appearance
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={20} className="text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun size={20} className="text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                toggleTheme();
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                showToast(`Switched to ${newTheme} mode`, 'success');
              }}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${theme === 'dark' ? 'bg-[#C5FF55]' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md
                  ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </Card>

        {/* app info */}
        <Card className="p-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-[#C5FF55] to-[#a3d948] rounded-xl mb-2">
              <Wallet size={24} className="text-gray-900" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              FinTech Wallet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
          </div>
        </Card>

        {/* logout button */}
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Settings;
