import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[ECHO_BOOT] Initializing React Engine...");

// Register Service Worker for PWA Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('[PWA] ServiceWorker registered:', registration.scope);
    }).catch(err => {
      console.log('[PWA] ServiceWorker registration failed:', err);
    });
  });
}

const boot = () => {
  const container = document.getElementById('root');
  if (container) {
    try {
      const root = createRoot(container);
      root.render(<App />);
      console.log("[ECHO_BOOT] Success: Engine Online.");
    } catch (err) {
      console.error("[ECHO_BOOT] Render Failed:", err);
    }
  } else {
    console.error("[ECHO_BOOT] Fatal: Root element not found.");
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}