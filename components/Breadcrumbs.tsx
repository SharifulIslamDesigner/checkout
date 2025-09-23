'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Breadcrumbs.module.css';

// --- নতুন: Interface যোগ করা হয়েছে ---
interface BreadcrumbsProps {
  // pageTitle হলো একটি ঐচ্ছিক prop
  pageTitle?: string; 
}

const formatBreadcrumb = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function Breadcrumbs({ pageTitle }: BreadcrumbsProps) {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const pathSegments = pathname.split('/').filter(segment => segment);

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
      <ol className={styles.breadcrumbList}>
        <li className={styles.breadcrumbItem}>
          <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        </li>
        
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = '/' + pathSegments.slice(0, index + 1).join('/');

          // --- কার্যকরী সমাধান: pageTitle ব্যবহার করা হচ্ছে ---
          let title = formatBreadcrumb(segment);
          if (isLast && pageTitle) {
            title = pageTitle; // যদি pageTitle prop দেওয়া থাকে, তাহলে সেটি ব্যবহার করো
          }
          // ----------------------------------------------------

          return (
            <li key={segment} className={styles.breadcrumbItem}>
              <span className={styles.separator}>/</span>
              {isLast ? (
                <span className={styles.currentPage}>{title}</span>
              ) : (
                <Link href={href} className={styles.breadcrumbLink}>
                  {title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}