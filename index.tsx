import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

console.log("[ECHO_BOOT] Script Execution Started");

const boot = () => {
  const container = document.getElementById('root');
  const statusEl = document.getElementById('boot-status');
  
  if (statusEl) statusEl.innerText = "Attaching React Fiber...";
  
  if (container) {
    try {
      const root = createRoot(container);
      root.render(<App />);
      console.log("[ECHO_BOOT] Success: App mounted.");
    } catch (err) {
      console.error("[ECHO_BOOT] Failed to mount:", err);
      if (statusEl) statusEl.innerText = "Fatal Error: " + err.message;
    }
  } else {
    console.error("[ECHO_BOOT] Fatal: Root element not found.");
  }
};

// Start booting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
