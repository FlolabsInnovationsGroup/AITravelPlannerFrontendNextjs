'use client';

import { useEffect, useState } from 'react';

const APP_VERSION = '2.0.0'; // MAJOR VERSION BUMP - FORCE RELOAD

export default function CacheBuster() {
  const [showReloading, setShowReloading] = useState(false);
  
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    
    // Force show in console even if it fails
    console.log('%c🔍 CACHE BUSTER RUNNING!', 'background: #ff0000; color: #fff; font-size: 20px; padding: 10px;');
    console.log('Stored version:', storedVersion, 'Current version:', APP_VERSION);
    
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log('%c🚨 VERSION MISMATCH - CLEARING CACHE!', 'background: #ff0000; color: #fff; font-size: 16px; padding: 8px;');
      setShowReloading(true);
      
      // Clear everything except auth
      const token = localStorage.getItem('token');
      const guestToken = localStorage.getItem('guest_token');
      
      localStorage.clear();
      sessionStorage.clear();
      
      if (token) localStorage.setItem('token', token);
      if (guestToken) localStorage.setItem('guest_token', guestToken);
      localStorage.setItem('app_version', APP_VERSION);
      
      // Clear caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // HARD reload with query param
      setTimeout(() => {
        window.location.href = window.location.pathname + '?v=' + APP_VERSION + '&t=' + Date.now();
      }, 500);
    } else {
      console.log('%c✅ Cache is current - v' + APP_VERSION, 'background: #00ff00; color: #000; font-size: 14px; padding: 5px;');
    }
  }, []);

  if (showReloading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        fontSize: '24px'
      }}>
        🔄 Updating app... Please wait...
      </div>
    );
  }

  return null;
}
