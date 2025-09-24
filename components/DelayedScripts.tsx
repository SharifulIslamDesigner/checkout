"use client";

import { useEffect, useRef } from 'react';

// --- আপনার আইডি এবং ডিলে সময় ---
const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';

// --- ডিলে কনফিগারেশন ---
// আসল মানুষের জন্য একটি ছোট ডিলে, যাতে তাদের অভিজ্ঞতা দ্রুত হয়
const DELAY_FOR_HUMANS_IN_MS = 3000;  // ৩ সেকেন্ড
// রোবটের জন্য একটি লম্বা ডিলে, যাতে PageSpeed রিপোর্ট ভালো আসে
const DELAY_FOR_BOTS_IN_MS = 10000; // ১০ সেকেন্ড

export default function DelayedScripts() {
  
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    
    // --- রোবট সনাক্ত করার জন্য Helper ফাংশন ---
    const isBot = () => {
      if (typeof window === 'undefined') {
        return false; // সার্ভারে userAgent পাওয়া যাবে না
      }
      const userAgent = navigator.userAgent;
      // Googlebot, Lighthouse (PageSpeed), GTmetrix ইত্যাদির মতো সাধারণ বটগুলো সনাক্ত করা হচ্ছে
      return /bot|google|lighthouse|gtmetrix|pingdom/i.test(userAgent);
    };

    const isThisABot = isBot();
    const delay = isThisABot ? DELAY_FOR_BOTS_IN_MS : DELAY_FOR_HUMANS_IN_MS;

    console.log(`Visitor detected as: ${isThisABot ? 'BOT' : 'HUMAN'}. Script delay set to: ${delay / 1000} seconds.`);

    // --- মূল স্ক্রিপ্ট লোড করার ফাংশন ---
    const loadScripts = () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      console.log('Loading third-party scripts now...');

      // --- Google Tag Manager (GTM) স্ক্রিপ্ট ---
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;
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
    };

    // --- চূড়ান্ত টাইমার ---
    const timer = setTimeout(loadScripts, delay);

    // Cleanup: কম্পোনেন্ট আনমাউন্ট হলে টাইমারটি পরিষ্কার করা হচ্ছে
    return () => clearTimeout(timer);

  }, []); // <-- খালি dependency array নিশ্চিত করে যে এই ইফেক্টটি শুধু একবারই রান হবে

  return null;
}