'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// --- শুধুমাত্র একবার রান করার জন্য একটি Helper ---
let nprogressStarted = false;

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // পেজ লোড সম্পন্ন হলে বারটি বন্ধ করুন
    NProgress.done();
    nprogressStarted = false;
    
    // --- কার্যকরী সমাধান: গ্লোবাল ক্লিক ইভেন্ট শোনা ---
    const handleAnchorClick = (event: MouseEvent) => {
        try {
            const targetUrl = (event.currentTarget as HTMLAnchorElement).href;
            if (!targetUrl) return;

            const newUrl = new URL(targetUrl);
            const currentUrl = new URL(window.location.href);

            // যদি ডোমেইন একই থাকে এবং পাথ ভিন্ন হয় (অর্থাৎ, একটি অভ্যন্তরীণ নেভিগেশন)
            if (newUrl.origin === currentUrl.origin && newUrl.pathname !== currentUrl.pathname) {
                const dynamicRoutes = ['/bikes', '/products', '/product/', '/checkout'];
                if (dynamicRoutes.some(route => newUrl.pathname.startsWith(route))) {
                    if (!nprogressStarted) {
                        NProgress.start();
                        nprogressStarted = true;
                    }
                }
            }
        } catch (err) {
            // URL পার্স করতে ব্যর্থ হলে কিছু করার দরকার নেই
        }
    };
    
    // --- ব্রাউজারের back/forward বাটনের জন্য ---
    const handlePopState = () => {
        NProgress.start();
        nprogressStarted = true;
    };

    // সমস্ত a[href] ট্যাগের উপর ক্লিক ইভেন্ট যোগ করা
    document.querySelectorAll('a[href]').forEach(anchor => {
        anchor.addEventListener('click', handleAnchorClick);
    });

    window.addEventListener('popstate', handlePopState);

    // --- Cleanup: কম্পোনেন্ট আনমাউন্ট হলে ইভেন্টগুলো সরিয়ে দিন ---
    return () => {
      document.querySelectorAll('a[href]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
      window.removeEventListener('popstate', handlePopState);
      NProgress.done(); // নিশ্চিত করুন যে বারটি বন্ধ হয়ে গেছে
      nprogressStarted = false;
    };
  }, [pathname, searchParams]); // pathname পরিবর্তন হলে useEffect আবার চলবে

  return null; // এই কম্পোনেন্টটি কোনো JSX রেন্ডার করে না
}