import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  Settings, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Eye, 
  EyeOff,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TransactionCard } from '../components/TransactionCard';
import { Skeleton } from '../components/Skeleton';
import api from '../api/axios';

const POLLING_INTERVAL = 10000;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const previousBalance = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    
    const pollingInterval = setInterval(async () => {
      try {
        const { data } = await api.get('/user/me');
        
        if (previousBalance.current !== null) {
          const prevBalance = parseFloat(previousBalance.current);
          const newBalance = parseFloat(data.balance);
          
          if (newBalance !== prevBalance) {
            const diff = newBalance - prevBalance;
            const message = diff > 0 
              ? `Balance increased by ₹${Math.abs(diff).toFixed(2)}`
              : `Balance decreased by ₹${Math.abs(diff).toFixed(2)}`;
            
            showToast(message, diff > 0 ? 'success' : 'info');
            await refreshUser();
            fetchTransactions();
          }
        }
        
        previousBalance.current = data.balance;
      } catch (error) {
        console.error('polling error:', error);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get('/transactions?limit=5&offset=0');
      setTransactions(data.data || []);
    } catch (error) {
      console.error('failed to fetch transactions:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await refreshUser();
      const { data: userData } = await api.get('/user/me');
      previousBalance.current = userData.balance;
      await fetchTransactions();
    } catch (error) {
      console.error('failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton variant="title" className="w-40" />
            <Skeleton variant="circle" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton variant="button" />
            <Skeleton variant="button" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-6 lg:pl-20">
      {/* header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Settings"
              >
                <Settings size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                aria-label="Logout"
              >
                <LogOut size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* balance card */}
        <Card className="p-6 bg-linear-to-br from-[#C5FF55] to-[#a3d948] dark:from-gray-800 dark:to-gray-900 border-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-700 dark:text-gray-400 text-sm font-medium">Main Balance</p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                {showBalance ? (
                  <Eye size={18} className="text-gray-700 dark:text-gray-400" />
                ) : (
                  <EyeOff size={18} className="text-gray-700 dark:text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-gray-800 dark:text-gray-400 text-lg sm:text-xl">₹</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {showBalance 
                  ? parseFloat(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '••••••'
                }
              </h2>
            </div>
          </div>
        </Card>

        {/* quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-col h-20 justify-center gap-1"
            onClick={() => navigate('/transfer?type=credit')}
          >
            <ArrowDownLeft size={20} />
            <span className="text-sm font-medium">Add Money</span>
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            className="flex-col h-20 justify-center gap-1"
            onClick={() => navigate('/transfer?type=debit')}
          >
            <ArrowUpRight size={20} />
            <span className="text-sm font-medium">Send Money</span>
          </Button>
        </div>

        {/* recent transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Transaction
            </h3>
            <Link 
              to="/transactions"
              className="text-sm text-[#C5FF55] hover:underline"
            >
              Show More
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start by adding money to your wallet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionCard 
                  key={transaction.id} 
                  transaction={transaction}
                  showDelete={false}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
