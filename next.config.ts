/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // TypeScript error থাকলে বিল্ড process থামিয়ে দেবে না।
  // প্রোডাকশনে যাওয়ার আগে এটি false করে দেওয়া বা মুছে ফেলা উচিত।
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint error থাকলে বিল্ড process থামিয়ে দেবে না।
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Next.js-এর ইমেজ অপ্টিমাইজেশনের জন্য অনুমোদিত ডোমেইনগুলো
  images: {
    // remotePatterns ব্যবহার করাই সেরা অভ্যাস
    remotePatterns: [
      // gobikes.au (www ছাড়া এবং www সহ উভয়ই যোগ করা ভালো)
      {
        protocol: 'https',
        hostname: 'gobikes.au',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gobikes.au', // ★ www সহ যোগ করা হলো
        pathname: '/wp-content/uploads/**',
      },
      // আপনার অন্যান্য ডোমেইনগুলো
      {
        protocol: 'https',
        hostname: 'devshariful.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.sharifulbuilds.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'www.paypalobjects.com' },
      { protocol: 'https', hostname: 'x.klarnacdn.net' },
      { protocol: 'https', hostname: 'static.afterpay.com' },
      { protocol: 'https', hostname: 'checkout.stripe.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.americanexpress.com' },
      { protocol: 'https', hostname: 'js.stripe.com' },
    ],
  },
};

export default nextConfig;