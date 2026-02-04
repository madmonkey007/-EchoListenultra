import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * 紧急挂载策略：
 * 1. 确保 DOM 完全可用
 * 2. 注入全局变量标识
 */
const startApp = () => {
  const container = document.getElementById('root');
  if (!container) return;

  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log("[BOOT] React Engine Active");
    // 成功后移除 Loading 界面由 React 处理或手动移除
  } catch (err) {
    console.error("[BOOT] React Render Failed:", err);
    container.innerHTML = `<div style="color:white; padding:40px; font-family:sans-serif;">
      <h1 style="color:#ff4444">Boot Failed</h1>
      <pre style="font-size:10px; opacity:0.5">${err.stack}</pre>
    </div>`;
  }
};

// 立即执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
