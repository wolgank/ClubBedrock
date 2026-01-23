import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { UserProvider } from './shared/context/UserContext';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
if (!clientId) {
  throw new Error("VITE_GOOGLE_CLIENT_ID no está definida en tu archivo .env");
}

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    const currentPath = window.location.pathname;

    const isOnPublicPage = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/logout",
      "/terms",
      "/",
    ].includes(currentPath);

    if (!isOnPublicPage) {
      if (typeof window.__forceSessionExpired === "function") {
        window.__forceSessionExpired(); // Llama al modal
      } else {
        // Fallback por si no se ha montado aún
        window.location.href = "/login";
      }
    }
  }

  return response;
};

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <App />
        </UserProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
