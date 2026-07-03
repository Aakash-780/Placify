import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/apiMock';
import './styles/index.css';
import App from './App.tsx';

// Clear old localStorage keys to prevent "Failed to fetch" from old backends
const currentBaseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
const savedBaseUrl = localStorage.getItem('insforge_last_base_url');
if (savedBaseUrl !== currentBaseUrl) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.includes('insforge') || key.includes('sb-') || key.includes('supabase') || key.includes('clerk'))) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem('insforge_last_base_url', currentBaseUrl || '');
  // Clear cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/"); 
  });
}

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
