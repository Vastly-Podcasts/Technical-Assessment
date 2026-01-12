import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled promise rejection:', event.reason);
  }
  
  // In production, you might want to send to error reporting service
  // Example: logErrorToService(event.reason);
  
  // Prevent default browser error handling (optional)
  // event.preventDefault();
});

// Handle general errors
window.addEventListener('error', (event) => {
  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error:', event.error);
  }
  
  // In production, you might want to send to error reporting service
  // Example: logErrorToService(event.error);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
); 