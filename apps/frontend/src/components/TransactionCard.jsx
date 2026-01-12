import { ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const TransactionCard = ({ transaction, onDelete, showDelete = false }) => {
  const { user } = useAuth();
  const isCredit = transaction.type === 'CREDIT';
  const isFailed = transaction.status === 'failed';
  const amount = parseFloat(transaction.amount);
  const fee = transaction.fee ? parseFloat(transaction.fee) : 0;

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTransactionDescription = () => {
    if (transaction.description) {
      return transaction.description;
    }
    if (isCredit) {
      return transaction.sender ? `From ${transaction.sender.name}` : 'Money Added';
    }
    return transaction.recipient ? `To ${transaction.recipient.name}` : 'Money Sent';
  };

  return (
    <div className={`flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors -mx-2 px-2 rounded-lg ${isFailed ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-3 flex-1">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isFailed 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            : isCredit 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }
        `}>
          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {getTransactionDescription()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(transaction.date)} • {formatTime(transaction.date)}
          </p>
          {isFailed && transaction.errorMessage && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {transaction.errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className={`font-semibold ${isFailed ? 'text-gray-400 dark:text-gray-500 line-through' : isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 text-nowrap'}`}>
            {isCredit ? '+' : '-'}₹{amount.toFixed(2)}
          </p>
          {fee > 0 && (
            <p className={`text-xs ${isFailed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
              Fee: ₹{fee.toFixed(2)}
            </p>
          )}
          {isFailed && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-1">
              Failed
            </p>
          )}
        </div>

        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            aria-label="Delete transaction"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
