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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'devshariful.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gobike.au',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.sharifulbuilds.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'gobikes.au',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**', // <-- समाधान: pathname যোগ করা হয়েছে
      },
    ],
  },
  
  // দ্রষ্টব্য: Partytown ("worker" strategy)-এর জন্য এখানে আর কোনো কনফিগারেশনের প্রয়োজন নেই।
};

// --- সমাধান: ES Module সিনট্যাক্স ব্যবহার করা হচ্ছে ---
export default nextConfig;