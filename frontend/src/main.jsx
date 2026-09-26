import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Automatically register the service worker for PWA support and caching
registerSW({
  immediate: true,
  onRegistered(registration) {
    console.log('[SecureDrop PWA] Service worker registered:', registration?.scope);
  },
  onRegisterError(error) {
    console.warn('[SecureDrop PWA] Service worker registration error:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

