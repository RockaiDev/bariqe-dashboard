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

const messages = { en, ar } as const;
type Locale = keyof typeof messages;

function AppWrapper() {
  const navigate = useNavigate();
  const { loading, authenticated } = useAuth();

  // تعيين navigate function لـ axios
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  if (loading) return <LoadingComponent />;

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
              // إذا كان المستخدم مسجل دخوله وحاول الوصول لصفحة login
              authenticated && route.path === "/login" ? (
                <Navigate to="/dashboard" replace />
              ) : (
                route.element
              )
            }
          />
        ))}

        {/* Default redirect based on authentication status */}
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

        {/* Catch all route - 404 */}
        {!authenticated && (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Fragment>
  );
}

// دالة مساعدة لاسترجاع اللغة من localStorage
const getStoredLocale = (): Locale => {
  try {
    const storedLocale = localStorage.getItem("locale") as Locale;
    return storedLocale && ['en', 'ar'].includes(storedLocale) ? storedLocale : "en";
  } catch (error) {
    // في حالة عدم توفر localStorage (SSR مثلاً)
    return "en";
  }
};

export default function App() {
  // استرجاع اللغة من localStorage أو تعيين الافتراضية
  const [locale, setLocale] = useState<Locale>(getStoredLocale());

  // دالة لتحديث اللغة وحفظها في localStorage
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    // حفظ في localStorage
    try {
      localStorage.setItem("locale", newLocale);
    } catch (error) {
      console.warn("Failed to save locale to localStorage:", error);
    }
  };

  // حفظ اللغة في localStorage عند التغيير (backup)
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