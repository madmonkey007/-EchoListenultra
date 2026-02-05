import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[ECHO_BOOT] Initializing React Engine...");

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
