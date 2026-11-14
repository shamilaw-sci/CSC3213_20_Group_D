
/**
 * @file main.jsx
 * @module Application
 * @desc Mounts the Care4U React web application.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// Mark fetched data as stale after 5 minutes and retry failed data queries once.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,   // 5 minutes
    },
  },
});

// Start the web app with shared data handling and notification messages.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />

      {/* Global notifications: success and error messages shown at the top-right. */}
      <Toaster
        position="top-right"
        toastOptions={{
          success: { duration: 3000 },
          error:   { duration: 4000 },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
