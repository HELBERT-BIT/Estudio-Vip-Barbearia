import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Module-level singleton reference so any component accessing the hook shares the prompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' && window.__pwaDeferredPrompt ? window.__pwaDeferredPrompt : null;

const promptListeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

function notifyPromptListeners(evt: BeforeInstallPromptEvent | null) {
  globalDeferredPrompt = evt;
  if (typeof window !== 'undefined') {
    window.__pwaDeferredPrompt = evt;
  }
  promptListeners.forEach((listener) => listener(evt));
}

// Listen globally immediately at module load time
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent standard automatic mini-infobar so our custom button controls the prompt
    e.preventDefault();
    const promptEvent = e as BeforeInstallPromptEvent;
    notifyPromptListeners(promptEvent);
  });

  window.addEventListener('appinstalled', () => {
    notifyPromptListeners(null);
  });

  window.addEventListener('pwa-deferred-prompt-ready', () => {
    if (window.__pwaDeferredPrompt) {
      notifyPromptListeners(window.__pwaDeferredPrompt);
    }
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      return globalDeferredPrompt || window.__pwaDeferredPrompt || null;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone display mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices (Safari does not support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(isIOSDevice);

    // Initial check from global state
    if (globalDeferredPrompt || window.__pwaDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt || window.__pwaDeferredPrompt || null);
    }

    // Subscribe to module-level prompt updates
    const handleUpdate = (evt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(evt);
    };
    promptListeners.add(handleUpdate);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      notifyPromptListeners(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      notifyPromptListeners(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptListeners.delete(handleUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Executes the native PWA installation prompt via beforeinstallprompt API.
   * Returns true if user accepted the installation, false otherwise.
   */
  const install = useCallback(async (): Promise<{
    success: boolean;
    outcome?: 'accepted' | 'dismissed';
    hasPrompt: boolean;
  }> => {
    const promptEvent = deferredPrompt || globalDeferredPrompt || window.__pwaDeferredPrompt;

    if (!promptEvent) {
      return { success: false, hasPrompt: false };
    }

    try {
      // Execute the native .prompt() method
      await promptEvent.prompt();

      // Wait for the user's choice
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        notifyPromptListeners(null);
        setIsInstalled(true);
        return { success: true, outcome: 'accepted', hasPrompt: true };
      }

      return { success: false, outcome: 'dismissed', hasPrompt: true };
    } catch (error) {
      console.warn('Erro ao disparar prompt() do PWA:', error);
      return { success: false, hasPrompt: true };
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt || (typeof window !== 'undefined' && window.__pwaDeferredPrompt)),
    isInstalled,
    isIOS,
    install,
    deferredPrompt: deferredPrompt || globalDeferredPrompt || (typeof window !== 'undefined' ? window.__pwaDeferredPrompt : null)
  };
}
