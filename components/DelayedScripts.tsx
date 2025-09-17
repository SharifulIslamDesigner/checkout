'use client';

import { useEffect } from 'react';

const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';
const DELAY_IN_MILLISECONDS = 15000; // ১৫ সেকেন্ড

export default function DelayedScripts() {
  
  useEffect(() => {
    
    const loadScripts = () => {
        // --- GTM স্ক্রিপ্ট যোগ করার লজিক ---
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
        gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.prepend(gtmNoScript);


        // --- Klaviyo স্ক্রিপ্ট যোগ করার লজিক ---
        const klaviyoScript = document.createElement('script');
        klaviyoScript.id = 'klaviyo-script';
        klaviyoScript.async = true;
        klaviyoScript.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_API_KEY}`;
        document.body.appendChild(klaviyoScript);
    };

    // ১৫ সেকেন্ড পরে স্ক্রিপ্টগুলো লোড করার জন্য টাইমার সেট করা
    const timer = setTimeout(() => {
      loadScripts();
    }, DELAY_IN_MILLISECONDS);

    // Cleanup: কম্পোনেন্ট আনমাউন্ট হলে টাইমারটি পরিষ্কার করে দিন
    return () => {
      clearTimeout(timer);
    };

  }, []); // <-- খালি dependency array নিশ্চিত করে যে এটি শুধু একবারই রান করবে

  return null; // এই কম্পোনেন্টটি কোনো JSX রেন্ডার করে না
}