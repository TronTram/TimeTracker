'use client';

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  if (confirm('A new version is available. Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Handle install prompt
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button
      const installButton = document.getElementById('pwa-install-button');
      if (installButton) {
        installButton.style.display = 'block';
      }
    };

    const handleInstallClick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        
        // Hide install button
        const installButton = document.getElementById('pwa-install-button');
        if (installButton) {
          installButton.style.display = 'none';
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.addEventListener('click', handleInstallClick);
    }

    // Handle app installed
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWA was installed');
      // Hide install button
      const installButton = document.getElementById('pwa-install-button');
      if (installButton) {
        installButton.style.display = 'none';
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (installButton) {
        installButton.removeEventListener('click', handleInstallClick);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

export default PWAInstaller;
