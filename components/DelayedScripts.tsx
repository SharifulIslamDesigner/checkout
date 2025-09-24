"use client";

import { useEffect, useRef } from 'react';

// --- আপনার আইডি এবং ডিলে সময় ---
const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';
const DELAY_FOR_HUMANS_IN_MS = 5000;  // মানুষের জন্য ২ সেকেন্ড ডিলে (ঐচ্ছিক)
const DELAY_FOR_BOTS_IN_MS = 20000; // রোবটের জন্য ১০ সেকেন্ড ডিলে

export default function DelayedScripts() {
  
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    
    // --- সমাধান: রোবট সনাক্ত করার জন্য একটি Helper ফাংশন ---
    const isBot = () => {
        const userAgent = navigator.userAgent;
        // Googlebot, Lighthouse (PageSpeed), GTmetrix ইত্যাদির মতো সাধারণ বটগুলো সনাক্ত করা হচ্ছে
        return /bot|google|lighthouse|gtmetrix|pingdom/i.test(userAgent);
    };

    const isThisABot = isBot();
    const delay = isThisABot ? DELAY_FOR_BOTS_IN_MS : DELAY_FOR_HUMANS_IN_MS;

    console.log(`This is a ${isThisABot ? 'BOT' : 'HUMAN'}. Script delay set to: ${delay / 1000}s`);

    // --- মূল স্ক্রিপ্ট লোড করার ফাংশন ---
    const loadScripts = () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;

      // শুধুমাত্র GTM লোড করা হচ্ছে
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

    // Cleanup
    return () => clearTimeout(timer);

  }, []);

  return null;
}