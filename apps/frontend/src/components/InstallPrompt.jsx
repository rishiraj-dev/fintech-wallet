import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './Button';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 bg-linear-to-br from-[#C5FF55] to-[#a3d948] rounded-xl flex items-center justify-center">
          <Download size={20} className="text-gray-900" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Install Wallet App
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Add to your home screen for quick access and offline use
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              variant="primary"
              size="sm"
              className="flex-1"
            >
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="secondary"
              size="sm"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
