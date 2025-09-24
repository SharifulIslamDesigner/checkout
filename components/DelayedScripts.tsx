"use client";

import { useEffect, useRef } from 'react';

const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';
const FALLBACK_DELAY_IN_MILLISECONDS = 10000; // ৭ সেকেন্ড

export default function DelayedScripts() {
  
  const hasLoadedRef = useRef(false); // স্ক্রিপ্ট লোড হয়েছে কি না, তা ট্র্যাক করার জন্য

  useEffect(() => {
    // --- মূল স্ক্রিপ্ট লোড করার ফাংশন ---
    const loadScripts = () => {
      // যদি স্ক্রিপ্ট আগে থেকেই লোড হয়ে গিয়ে থাকে, তাহলে আর কিছু করার দরকার নেই
      if (hasLoadedRef.current) {
        return;
      }
      hasLoadedRef.current = true; // লোড হয়ে গেছে হিসেবে চিহ্নিত করা

      // --- GTM স্ক্রিপ্ট ---
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

    // --- ফলব্যাক টাইমার সেট করা হচ্ছে ---
    const fallbackTimer = setTimeout(loadScripts, FALLBACK_DELAY_IN_MILLISECONDS);

    // --- ব্যবহারকারীর কার্যকলাপের জন্য ইভেন্ট লিসেনার যোগ করা হচ্ছে ---
    const userInteractionListener = () => {
      setTimeout(loadScripts, 5000); 
      // একবার লোড হয়ে গেলে টাইমার এবং লিসেনার—দুটোই পরিষ্কার করা হচ্ছে
      clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', userInteractionListener);
      window.removeEventListener('mousemove', userInteractionListener);
      window.removeEventListener('touchstart', userInteractionListener);
    };

    window.addEventListener('scroll', userInteractionListener, { once: true });
    window.addEventListener('mousemove', userInteractionListener, { once: true });
    window.addEventListener('touchstart', userInteractionListener, { once: true });

    // Cleanup: কম্পোনেন্ট আনমাউন্ট হলে টাইমার এবং লিসেনারগুলো পরিষ্কার করা হচ্ছে
    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('scroll', userInteractionListener);
      window.removeEventListener('mousemove', userInteractionListener);
      window.removeEventListener('touchstart', userInteractionListener);
    };

  }, []);

  return null;
}