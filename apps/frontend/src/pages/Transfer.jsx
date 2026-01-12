import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, IndianRupee, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSlideUp } from '../contexts/SlideUpContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../api/axios';

const Transfer = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showSlideUp } = useSlideUp();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('type') === 'debit' ? 'debit' : 'credit';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [amount, setAmount] = useState('');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // business config
  const [config, setConfig] = useState({
    feePercentage: 0.02,
    maxTransactionLimit: 10000,
    minTransactionAmount: 1,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    // search for recipients when typing in debit tab
    if (activeTab === 'debit' && recipientQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [recipientQuery, activeTab]);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      setConfig({
        feePercentage: data.feePercentage || 0.02,
        maxTransactionLimit: data.maxTransactionLimit || 10000,
        minTransactionAmount: data.minTransactionAmount || 1,
      });
    } catch (error) {
      console.error('failed to fetch config:', error);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const { data } = await api.get(`/user/search?q=${encodeURIComponent(recipientQuery)}`);
      setSearchResults(data || []);
    } catch (error) {
      console.error('search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const calculateFee = () => {
    if (activeTab !== 'debit' || !amount) return 0;
    const amt = parseFloat(amount);
    if (isNaN(amt)) return 0;
    return amt * config.feePercentage;
  };

  const calculateTotal = () => {
    const amt = parseFloat(amount) || 0;
    const fee = calculateFee();
    return amt + fee;
  };

  const validateAmount = () => {
    const amt = parseFloat(amount);
    
    if (!amount || isNaN(amt)) {
      return 'amount is required';
    }
    
    if (amt < config.minTransactionAmount) {
      return `minimum amount is ₹${config.minTransactionAmount}`;
    }
    
    if (amt > config.maxTransactionLimit) {
      return `maximum amount is ₹${config.maxTransactionLimit.toLocaleString('en-IN')}`;
    }
    
    if (amt <= 0) {
      return 'amount must be positive';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate amount
    const amountError = validateAmount();
    if (amountError) {
      showToast(amountError, 'error');
      return;
    }

    // validate recipient for debit
    if (activeTab === 'debit' && !selectedRecipient) {
      showToast('please select a recipient', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        type: activeTab.toUpperCase(),
        amount: parseFloat(amount),
      };

      if (activeTab === 'debit') {
        payload.recipientId = selectedRecipient.id;
      }

      const { data } = await api.post('/transactions', payload);
      
      showSlideUp({
        type: 'success',
        title: activeTab === 'credit' ? 'Money Added!' : 'Money Sent!',
        message: activeTab === 'credit' 
          ? `Successfully added to your wallet` 
          : `Sent to ${selectedRecipient.name}`,
        amount: amount,
        onAction: () => navigate('/transactions'),
      });
      
      await refreshUser();
      
      setAmount('');
      setRecipientQuery('');
      setSelectedRecipient(null);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Transaction failed';
      
      let shortMessage = 'Failed';
      if (errorMessage.toLowerCase().includes('insufficient')) {
        shortMessage = 'Insufficient balance';
      } else if (errorMessage.toLowerCase().includes('recipient not found')) {
        shortMessage = 'Recipient not found';
      } else if (errorMessage.toLowerCase().includes('minimum')) {
        shortMessage = 'Amount too low';
      } else if (errorMessage.toLowerCase().includes('maximum')) {
        shortMessage = 'Amount too high';
      }
      
      showSlideUp({
        type: 'error',
        title: 'Transaction Failed',
        message: activeTab === 'credit' 
          ? 'Could not add money to wallet' 
          : `Could not send money to ${selectedRecipient?.name || 'recipient'}`,
        amount: amount,
      });
      
      showToast(shortMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectRecipient = (user) => {
    setSelectedRecipient(user);
    setRecipientQuery(user.name);
    setSearchResults([]);
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

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
              {activeTab === 'credit' ? 'Add Money' : 'Send Money'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* tabs */}
        <Card className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveTab('credit');
              }}
              className={`
                py-3 px-4 rounded-xl font-medium transition-all duration-200
                ${activeTab === 'credit'
                  ? 'bg-[#C5FF55] text-gray-900 shadow-md scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              Add Money
            </button>
            <button
              onClick={() => {
                setActiveTab('debit');
              }}
              className={`
                py-3 px-4 rounded-xl font-medium transition-all duration-200
                ${activeTab === 'debit'
                  ? 'bg-[#C5FF55] text-gray-900 shadow-md scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              Send Money
            </button>
          </div>
        </Card>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* recipient search (debit only) */}
          {activeTab === 'debit' && (
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Recipient
              </h3>
              
              <div className="relative">
                <Input
                  placeholder="Search by name or email..."
                  value={recipientQuery}
                  onChange={(e) => {
                    setRecipientQuery(e.target.value);
                    if (selectedRecipient) setSelectedRecipient(null);
                  }}
                  icon={Search}
                />
                
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#C5FF55] rounded-full animate-spin" />
                  </div>
                )}

                {/* search results dropdown */}
                {searchResults.length > 0 && !selectedRecipient && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectRecipient(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedRecipient && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {selectedRecipient.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedRecipient.email}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* amount */}
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Amount
            </h3>
            
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              icon={IndianRupee}
              step="0.01"
              min="0"
              className="text-xl font-bold"
            />

            {/* quick amounts */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-[#C5FF55] dark:hover:bg-[#C5FF55] hover:text-gray-900 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-all hover:scale-105"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* fee preview (debit only) */}
            {activeTab === 'debit' && amount && parseFloat(amount) > 0 && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                      Transaction Fee: {(config.feePercentage * 100).toFixed(1)}%
                    </p>
                    <div className="space-y-1 text-amber-800 dark:text-amber-200">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">₹{parseFloat(amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span className="font-medium">₹{calculateFee().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-amber-300 dark:border-amber-700">
                        <span className="font-semibold">Total Deducted:</span>
                        <span className="font-bold">₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            {activeTab === 'credit' ? 'Add Money' : 'Send Money'}
          </Button>
        </form>

        {/* info */}
        <Card className="p-4">
          <div className="flex gap-3">
            <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Transaction Limits</p>
              <ul className="space-y-1">
                <li>• Minimum: ₹{config.minTransactionAmount.toLocaleString('en-IN')}</li>
                <li>• Maximum: ₹{config.maxTransactionLimit.toLocaleString('en-IN')}</li>
                {activeTab === 'debit' && (
                  <li>• Fee: {(config.feePercentage * 100).toFixed(1)}% on transfers</li>
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Transfer;
