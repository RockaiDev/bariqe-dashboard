const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

import type { NextConfig } from 'next';


const nextConfig: NextConfig = {
     output: 'standalone',
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bariqealtamyoz.com',
  },
  images: {
    qualities: [100, 75], // Support quality 100 for logo.svg
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'example.com' },
      { protocol: 'https', hostname: 'example.com' }
    ]
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/ar', // Default locale - Arabic
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
