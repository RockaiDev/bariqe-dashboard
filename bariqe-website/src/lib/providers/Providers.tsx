'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import QueryProvider from './QueryProvider';
import { LoadingProvider } from './LoadingProvider';
import { AuthStateListenerWrapper } from './AuthStateListenerWrapper';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthStateListenerWrapper>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </AuthStateListenerWrapper>
   
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryProvider>
  );
}
