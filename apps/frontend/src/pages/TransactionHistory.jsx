import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, ChevronDown, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TransactionCard } from '../components/TransactionCard';
import { Skeleton } from '../components/Skeleton';
import api from '../api/axios';

const POLLING_INTERVAL = 10000;

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    page: 1,
  });
  const previousTotal = useRef(null);

  useEffect(() => {
    fetchTransactions();
    
    const pollingInterval = setInterval(async () => {
      try {
        const params = {
          limit: pagination.limit,
          offset: 0,
        };
        
        if (filter !== 'all') {
          params.type = filter;
        }
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }

        const { data } = await api.get('/transactions', { params });
        
        if (previousTotal.current !== null && data.pagination?.total !== previousTotal.current) {
          const newCount = data.pagination.total - previousTotal.current;
          if (newCount > 0) {
            showToast(`${newCount} new transaction${newCount > 1 ? 's' : ''}`, 'info');
            if (pagination.offset === 0) {
              setTransactions(data.data || []);
              setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                page: data.pagination?.page || 1,
              }));
            }
          }
        }
        
        previousTotal.current = data.pagination?.total || 0;
      } catch (error) {
        console.error('polling error:', error);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, [filter, statusFilter, startDate, endDate, pagination.offset]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
      };
      
      if (filter !== 'all') {
        params.type = filter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const { data } = await api.get('/transactions', { params });
      
      if (pagination.offset > 0) {
        setTransactions(prev => [...prev, ...(data.data || [])]);
      } else {
        setTransactions(data.data || []);
      }
      
      const newTotal = data.pagination?.total || 0;
      setPagination(prev => ({
        ...prev,
        total: newTotal,
        page: data.pagination?.page || 1,
      }));
      
      if (previousTotal.current === null) {
        previousTotal.current = newTotal;
      }
    } catch (error) {
      console.error('failed to fetch transactions:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!confirm('Are you sure you want to hide this transaction?')) {
      return;
    }

    try {
      await api.delete(`/transactions/${transactionId}`);
      // remove from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      showToast('Transaction hidden successfully', 'success');
    } catch (error) {
      console.error('failed to delete transaction:', error);
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, offset: 0, page: 1 }));
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPagination(prev => ({ ...prev, offset: 0, page: 1 }));
  };

  const handleDateChange = () => {
    setPagination(prev => ({ ...prev, offset: 0, page: 1 }));
  };

  const clearFilters = () => {
    setFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPagination(prev => ({ ...prev, offset: 0, page: 1 }));
  };

  const hasActiveFilters = filter !== 'all' || statusFilter !== 'all' || startDate || endDate;

  const loadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  const hasMore = pagination.offset + transactions.length < pagination.total;

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
              Transaction History
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-[#C5FF55] rounded-full"></span>
            )}
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-[#C5FF55] text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleFilterChange('CREDIT')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'CREDIT'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Credit
                  </button>
                  <button
                    onClick={() => handleFilterChange('DEBIT')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === 'DEBIT'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Debit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleStatusFilterChange('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-[#C5FF55] text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleStatusFilterChange('completed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Success
                  </button>
                  <button
                    onClick={() => handleStatusFilterChange('failed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Failed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      handleDateChange();
                    }}
                    className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#C5FF55] focus:border-transparent"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      handleDateChange();
                    }}
                    className="px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#C5FF55] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          {loading && pagination.offset === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton variant="circle" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                  <Skeleton className="w-16 h-6" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {filter !== 'all' || statusFilter !== 'all' || startDate || endDate 
                  ? 'Try adjusting the filters' 
                  : 'Start by adding money to your wallet'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onDelete={handleDelete}
                    showDelete={true}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    variant="secondary"
                    onClick={loadMore}
                    loading={loading}
                    className="w-full sm:w-auto"
                  >
                    Load More
                  </Button>
                </div>
              )}

              {!hasMore && transactions.length > 0 && (
                <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
                  You've reached the end
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;
