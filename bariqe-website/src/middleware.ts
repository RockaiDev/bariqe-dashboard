import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // قائمة اللغات المدعومة
  locales: ['ar', 'en'],

  // اللغة الافتراضية
  defaultLocale: 'ar',

  // التوجيه تلقائياً حسب المتصفح
  localeDetection: false
});

export const config = {
  // تطبيق middleware على كل المسارات ما عدا المستثناة
  matcher: [
    // تطبيق على جميع pathnames إلا:
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // ولكن تطبيق على api/... في المجلد الجذر
    '/',
    '/(ar|en)/:path*'
  ]
};


