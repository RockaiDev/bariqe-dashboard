// providers/LoadingProvider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import LoadingComponent from '@/shared/components/LoadingComponent';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const showLoading = (loadingMessage = 'Loading...') => {
    setMessage(loadingMessage);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <LoadingComponent 
          message={message} 
          fullScreen={true}
        />
      )}
    </LoadingContext.Provider>
  );
}

