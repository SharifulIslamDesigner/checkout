"use client";

import { useEffect, useRef } from 'react';

// --- আপনার আইডি এবং ডিলে সময় এখানে কনফিগার করুন ---
const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';
const DELAY_IN_MILLISECONDS = 15000; // ৭০০০ মিলিসেকেন্ড = ৭ সেকেন্ড

export default function DelayedScripts() {
  
  // useRef ব্যবহার করা হচ্ছে যাতে স্ক্রিপ্টগুলো একাধিকবার লোড না হয়
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    
    // --- মূল স্ক্রিপ্ট লোড করার ফাংশন ---
    const loadScripts = () => {
      // যদি স্ক্রিপ্ট আগে থেকেই লোড হয়ে গিয়ে থাকে, তাহলে আর কিছু করার দরকার নেই
      if (hasLoadedRef.current) {
        return;
      }
      hasLoadedRef.current = true; // লোড হয়ে গেছে হিসেবে চিহ্নিত করা

      console.log(`Scripts are loading after ${DELAY_IN_MILLISECONDS / 1000} seconds...`);

      // --- GTM স্ক্রিপ্ট ---
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
      `;
      document.head.appendChild(gtmScript);
      
      const gtmNoScript = document.createElement('noscript');
      gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.prepend(gtmNoScript);

      // --- Klaviyo স্ক্রিপ্ট ---
      const klaviyoScript = document.createElement('script');
      klaviyoScript.id = 'klaviyo-script';
      klaviyoScript.async = true;
      klaviyoScript.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_API_KEY}`;
      document.body.appendChild(klaviyoScript);

      // Facebook, TikTok ইত্যাদি স্ক্রিপ্টও একইভাবে এখানে যোগ করতে পারেন
    };

    // --- একটিমাত্র টাইমার সেট করা হচ্ছে ---
    const timer = setTimeout(loadScripts, DELAY_IN_MILLISECONDS);

    // Cleanup: কম্পোনেন্টটি আনমাউন্ট হলে (যেমন পেজ পরিবর্তন হলে) টাইমারটি পরিষ্কার করা হচ্ছে
    return () => {
      clearTimeout(timer);
    };

  }, []); // <-- খালি dependency array নিশ্চিত করে যে এই ইফেক্টটি শুধু একবারই রান হবে

  // এই কম্পোনেন্টটি কোনো JSX রেন্ডার করে না
  return null;
}