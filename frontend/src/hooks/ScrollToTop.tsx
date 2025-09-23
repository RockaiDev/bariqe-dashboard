// hooks/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Hook للتمرير التلقائي عند تغيير المسار
export function useScrollToTop() {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
}

// Function منفصلة للتمرير اليدوي
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth' // للتمرير السلس
  });
};

// Component للتمرير التلقائي (الإصدار الأصلي)
export default function ScrollToTop() {
  useScrollToTop();
  return null;
}