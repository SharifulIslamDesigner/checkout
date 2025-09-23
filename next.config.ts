/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // --- শুধুমাত্র এই অংশটুকু যোগ করুন ---
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        
        protocol: 'https',
        hostname: 'sharifulbuilds.com',
        port: '',
        pathname: '/wp-content/uploads/**', // শুধুমাত্র uploads ফোল্ডার থেকে ছবি আনার অনুমতি
      },
       {
         protocol: 'https',
        hostname: 'gobike.au',
         port: '',
         pathname: '/wp-content/uploads/**',
         
       },
        {
         protocol: 'https',
        hostname: 'gobikes.au',
         port: '',
         pathname: '/wp-content/uploads/**',
         
       },
       {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // --- এই পর্যন্ত ---
};

module.exports = nextConfig;