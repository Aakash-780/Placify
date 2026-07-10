import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/apiMock';
import './styles/index.css';
import App from './App.tsx';

// Clear stale localStorage keys only (not cookies) when the backend URL changes.
// This prevents "Failed to fetch" from old backends without destroying valid sessions.
const currentBaseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
const savedBaseUrl = localStorage.getItem('insforge_last_base_url');
if (savedBaseUrl !== currentBaseUrl) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    // Only clear SDK-internal keys — do NOT clear placify_session_active or placify_organization_id
    if (key && (key.startsWith('sb-') || key.startsWith('supabase') || key.startsWith('clerk'))) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem('insforge_last_base_url', currentBaseUrl || '');
  // NOTE: Do NOT clear cookies here. Clearing cookies destroys the httpOnly
  // refresh cookie that the SDK uses to restore sessions after page reloads.
  // The Vite proxy Domain-stripping fix handles cookie compatibility for localhost.
}

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
