// App.tsx
import { Fragment, useEffect, useState } from "react";
import { IntlProvider } from "react-intl";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { routes, authenticationRoutes } from "./helper/routes";
import ScrollToTop from "./hooks/ScrollToTop";
import HeaderLayout from "./layouts/HeaderLayout";
import { LanguageProvider } from "./context/LanguageContext";

import en from "./translations/en.json";
import ar from "./translations/ar.json";
import useAuth from "./hooks/useAuth";
import LoadingComponent from "./components/shared/LoadingComponent";
import { setNavigate } from './helper/axiosInstance';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from "@/stores/authStore";

const messages = { en, ar } as const;
type Locale = keyof typeof messages;

function AppWrapper() {
  const navigate = useNavigate();
  const { loading, authenticated } = useAuth();
  const { isInitialized } = useAuthStore();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  if (!isInitialized || loading) {
    return <LoadingComponent />;
  }

  return (
    <Fragment>
      <Routes>
        {/* Protected Routes */}
        {authenticated &&
          routes.map((route: any, index: number) => (
            <Route
              key={index}
              element={<HeaderLayout>{route.element}</HeaderLayout>}
              path={route.path}
            />
          ))}

        {/* Authentication Routes */}
        {authenticationRoutes.map((route: any, index: number) => (
          <Route
            key={index}
            path={route.path}
            element={
              authenticated && route.path === "/login" ? (
                <Navigate to="/dashboard" replace />
              ) : (
                route.element
              )
            }
          />
        ))}

        {/* Default redirect */}
        <Route
          path="/"
          element={
            authenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all route */}
        {!authenticated && (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
        {authenticated && (
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        )}
      </Routes>
    </Fragment>
  );
}

const getStoredLocale = (): Locale => {
  try {
    const storedLocale = localStorage.getItem("locale") as Locale;
    return storedLocale && ['en', 'ar'].includes(storedLocale) ? storedLocale : "en";
  } catch (error) {
    return "en";
  }
};

export default function App() {
  const [locale, setLocale] = useState<Locale>(getStoredLocale());

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("locale", newLocale);
    } catch (error) {
      console.warn("Failed to save locale to localStorage:", error);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("locale", locale);
    } catch (error) {
      console.warn("Failed to save locale to localStorage:", error);
    }
  }, [locale]);

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <LanguageProvider locale={locale} setLocale={handleSetLocale}>
        <Router>
          <AppWrapper />
          <ScrollToTop />
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </Router>
      </LanguageProvider>
    </IntlProvider>
  );
}