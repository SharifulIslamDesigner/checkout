'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

let nprogressStarted = false;

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (nprogressStarted) {
      NProgress.done();
      nprogressStarted = false;
    }

    // --- সমাধান: ইভেন্ট প্যারামিটারের টাইপ 'Event' করা হয়েছে ---
    const handleAnchorClick = (event: Event) => {
        try {
            // সমাধান: ইভেন্টের টার্গেটকে HTMLAnchorElement হিসেবে কাস্ট করা হচ্ছে
            const target = event.currentTarget as HTMLAnchorElement;
            const targetUrl = target.href;

            if (!targetUrl) return;

            const currentUrl = new URL(window.location.href);
            const newUrl = new URL(targetUrl);

            // যদি এটি একটি অভ্যন্তরীণ নেভিগেশন হয় এবং হ্যাশ লিঙ্ক না হয়
           if (newUrl.origin === currentUrl.origin && newUrl.pathname !== currentUrl.pathname) {
                const dynamicRoutes = ['/bikes', '/products', '/product/', '/spare-parts', '/checkout'];
                if (dynamicRoutes.some(route => newUrl.pathname.startsWith(route))) {
                    if (!nprogressStarted) {
                        NProgress.start();
                        nprogressStarted = true;
                    }
                }
            }
        } catch (err) {
           console.warn("Could not parse URL, ignoring NProgress.", err);
            // URL পার্স করতে ব্যর্থ হলে কিছু করার দরকার নেই
        }
    };
    
    const handlePopState = () => {
        if (!nprogressStarted) {
            NProgress.start();
            nprogressStarted = true;
        }
    };

    document.querySelectorAll('a[href]').forEach(anchor => {
        anchor.addEventListener('click', handleAnchorClick);
    });

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.querySelectorAll('a[href]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, searchParams]);

  return null;
}