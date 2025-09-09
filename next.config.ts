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
    ],
  },
  // --- এই পর্যন্ত ---
};

module.exports = nextConfig;