import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './utils/errorBoundary'
import { logger } from './utils/logger'
import { useAppStore } from './store'

// 全局错误处理
window.addEventListener('error', (event) => {
  logger.error('Global error caught', {
    message: event.error?.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

// 性能监控
if ('performance' in window) {
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    logger.info('Page load performance', {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    });
  });
}

// 初始化深色模式状态
const initDarkMode = () => {
  const stored = localStorage.getItem('app-storage');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      if (data.state?.isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      console.error('Failed to parse stored app state:', error);
    }
  }
};

// 在应用启动前初始化深色模式
initDarkMode();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
) 