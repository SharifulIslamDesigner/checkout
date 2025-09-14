'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // ডিফল্ট স্টাইল ইম্পোর্ট করা হচ্ছে

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // --- কার্যকরী সমাধান: শুধুমাত্র নির্দিষ্ট পেজগুলোর জন্য nprogress চালু করুন ---
    const dynamicRoutes = ['/bikes', '/products', '/product/', '/checkout'];
    
    // URL পরিবর্তন শুরু হলে
    const handleStart = (url: string) => {
      const newPathname = new URL(url, window.location.origin).pathname;
      // যদি নতুন পাথটি আমাদের ডাইনামিক রুটের তালিকার কোনো একটি দিয়ে শুরু হয়
      if (dynamicRoutes.some(route => newPathname.startsWith(route))) {
        NProgress.start();
      }
    };

    // URL পরিবর্তন শেষ হলে
    const handleStop = () => {
      NProgress.done();
    };
    
    // --- Next.js-এর রাউটিং ইভেন্টের সাথে লিঙ্ক করা ---
    // এই অংশটি লিঙ্কে ক্লিক করলে handleStart কল করে
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      handleStart(args[2] as string);
      originalPushState.apply(history, args);
    };

    // ব্রাউজারের back/forward বাটনের জন্য
    window.addEventListener('popstate', handleStop);

    // handleStop ফাংশনটি এখানে সরাসরি কল করা হচ্ছে পেজ লোড সম্পন্ন হলে
    handleStop();
    
    // Cleanup
    return () => {
      history.pushState = originalPushState;
      window.removeEventListener('popstate', handleStop);
    };
  }, [pathname, searchParams]);

  return null; // এই কম্পোনেন্টটি কোনো JSX রেন্ডার করে না
}