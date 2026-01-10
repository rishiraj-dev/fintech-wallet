import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Send } from 'lucide-react';

export const FloatingBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home },
    { path: '/transactions', icon: History },
    { path: '/transfer?type=debit', icon: Send },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-2xl px-2 py-2 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path.includes('transfer') && location.pathname === '/transfer');
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center justify-center w-14 h-14 rounded-full
                  transition-all duration-300
                  ${isActive 
                    ? 'bg-[#C5FF55] text-gray-900 shadow-lg scale-110' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                  }
                `}
              >
                <Icon size={22} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const FloatingSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/transactions', icon: History, label: 'History' },
    { path: '/transfer?type=debit', icon: Send, label: 'Quick Pay' },
  ];

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-screen w-20 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center h-full py-8 gap-6">
        {/* logo area */}
        <div className="w-12 h-12 bg-linear-to-br from-[#C5FF55] to-[#a3d948] rounded-xl flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-gray-900">₹</span>
        </div>

        {/* navigation */}
        <div className="flex-1 flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path.includes('transfer') && location.pathname === '/transfer');
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={`
                  relative flex items-center justify-center w-14 h-14 rounded-xl
                  transition-all duration-300 group
                  ${isActive 
                    ? 'bg-[#C5FF55] text-gray-900 shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={24} strokeWidth={2} />
                
                {/* tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
