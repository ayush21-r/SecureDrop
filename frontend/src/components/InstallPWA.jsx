import React, { useState, useEffect } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  Shield,
  X,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import Button from './Button';

/**
 * Custom hook to detect PWA installability, standalone status, and platform.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS / iPadOS
    const userAgent = window.navigator.userAgent || '';
    const isIosDevice =
      /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // 3. Listen for Chromium/Android 'beforeinstallprompt' event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    // Show native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    triggerInstall,
  };
}

/**
 * InstallPWA component: Renders a sleek, responsive installation banner or button.
 * Respects user dismissal and fits the SecureDrop dark aesthetic.
 */
export default function InstallPWA({ variant = 'banner', className = '' }) {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('securedrop_pwa_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('securedrop_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      setInstalling(true);
      await triggerInstall();
      setInstalling(false);
    }
  };

  // If already installed or dismissed, do not render banner
  if (isInstalled || (dismissed && variant === 'banner')) {
    return null;
  }

  // If not installable and not iOS, do not render banner
  if (!isInstallable && !isIOS && variant === 'banner') {
    return null;
  }

  // Button-only variant (e.g. for Navbar or Profile page)
  if (variant === 'button') {
    if (!isInstallable && !isIOS) return null;
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer ${className}`}
        title="Install SecureDrop App"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-4 sm:p-5 shadow-lg relative overflow-hidden ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">
                Install SecureDrop App
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-xl">
              Get the standalone experience on your device with instant launch, offline vault access to cached assets, and fullscreen security.
            </p>

            {/* iOS Safari Guide Modal/Drawer if triggered on iOS */}
            {showIOSGuide && (
              <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <Share className="w-4 h-4 text-emerald-400" />
                  <span>To install on iOS / iPadOS:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                  <li>Tap the <strong className="text-white">Share</strong> icon at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong>.</li>
                  <li>Tap <strong className="text-white">Add</strong> in the top-right corner.</li>
                </ol>
              </div>
            )}

            <div className="mt-3 flex items-center space-x-3">
              <Button
                size="sm"
                icon={Download}
                loading={installing}
                onClick={handleInstallClick}
              >
                {isIOS ? 'How to Install on iOS' : 'Install SecureDrop'}
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
