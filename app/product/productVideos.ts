// app/products/productVideos.ts

// এই অবজেক্টটি আমাদের "নির্দেশিকা তালিকা"।
// key: প্রোডাক্টের slug, value: ইউটিউব ভিডিওর ID।

interface VideoMap {
  [key: string]: string;
}

export const productVideoMap: VideoMap = {
  // --- এখানে আপনার সঠিক প্রোডাক্ট slug এবং ভিডিও ID যোগ করুন ---
  
  'ebike-for-kids-12-inch-electric-bike-ages-2-5': 'VqwGe-RO0nM',
  'ebike-for-sale-16-inch-gobike-ages-5-9': 'CIevuTbyTlY',
  '20-inch-electric-bikes-for-sale-ebike-for-kids': 'qtDplxct2gE',
};