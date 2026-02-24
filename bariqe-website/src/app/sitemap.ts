import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';
const locales = ['en', 'ar']; // Add all supported locales

// Add all your routes here
const routes = [
  '',
  'about',
  'contact',
  'all-products',
  
];

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static routes
  routes.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route ? `/${route}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8, // Higher priority for homepage
      });
    });
  });

  return sitemapEntries;
}

