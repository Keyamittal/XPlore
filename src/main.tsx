import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept all API fetches to automatically include the JWT Authorization header
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = sessionStorage.getItem('xplore_token');
  if (token) {
    let isBackend = false;
    if (typeof input === 'string') {
      isBackend = input.startsWith('http://localhost:3000') || input.startsWith('/api/');
    } else if (input instanceof URL) {
      isBackend = input.href.startsWith('http://localhost:3000');
    }
    
    if (isBackend) {
      init = init || {};
      const headers = init.headers ? { ...init.headers } as any : {};
      headers['Authorization'] = `Bearer ${token}`;
      init.headers = headers;
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
