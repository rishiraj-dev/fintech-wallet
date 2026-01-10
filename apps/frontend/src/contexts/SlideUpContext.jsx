import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const SlideUpContext = createContext(null);

export const SlideUpProvider = ({ children }) => {
  const [panel, setPanel] = useState(null);

  const showSlideUp = useCallback((data) => {
    setPanel(data);
  }, []);

  const hideSlideUp = useCallback(() => {
    setPanel(null);
  }, []);

  return (
    <SlideUpContext.Provider value={{ showSlideUp, hideSlideUp }}>
      {children}
      {panel && <SlideUpPanel {...panel} onClose={hideSlideUp} />}
    </SlideUpContext.Provider>
  );
};

const SlideUpPanel = ({ type, title, message, amount, onClose, onAction }) => {
  const isSuccess = type === 'success';

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* slide up panel */}
      <div
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-800
          rounded-t-3xl shadow-2xl
          animate-in slide-in-from-bottom duration-500
          max-w-lg mx-auto
        "
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* content */}
        <div className="px-6 pb-6 pt-2">
          {/* icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${isSuccess 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }
                animate-in zoom-in duration-500
              `}
            >
              {isSuccess ? <CheckCircle size={48} /> : <XCircle size={48} />}
            </div>
          </div>

          {/* title */}
          <h3
            className={`
              text-xl font-bold text-center mb-2
              ${isSuccess 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
              }
            `}
          >
            {title}
          </h3>

          {/* amount */}
          {amount && (
            <p className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
              ₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}

          {/* message */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
            {message}
          </p>

          {/* action button */}
          <button
            onClick={() => {
              if (onAction) {
                onAction();
              }
              onClose();
            }}
            className="
              w-full py-3 px-6 rounded-xl font-semibold text-base
              bg-[#C5FF55] hover:bg-[#b3e84d]
              text-gray-900 shadow-lg
              transition-all duration-200
              active:scale-95
            "
          >
            {onAction ? 'View Details' : 'Done'}
          </button>
        </div>
      </div>
    </>
  );
};

export const useSlideUp = () => {
  const context = useContext(SlideUpContext);
  if (!context) {
    throw new Error('useSlideUp must be used within a SlideUpProvider');
  }
  return context;
};
