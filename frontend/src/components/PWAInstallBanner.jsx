import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Monitor online/offline state
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if user previously dismissed today
      const dismissed = localStorage.getItem('mindbridge_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('mindbridge_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-500/90 backdrop-blur-md text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-fade-in z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline. Cached check-ins and journal entries are safely stored on this device.</span>
        </div>
      )}

      {/* PWA Install Drawer / Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-16 md:bottom-5 right-4 left-4 md:left-auto md:w-96 z-40 animate-bounce-subtle">
          <div className="liquid-glass rounded-3xl p-4 shadow-wellness-lg border border-teal-200/80 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-glow-teal">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Install MindBridge App</h4>
              <p className="text-[11px] text-charcoal-600 leading-tight mt-0.5 truncate">
                1-tap offline check-ins & fast mobile access
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold shadow-wellness-sm transition flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-cream-100 transition"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
