import { Suspense } from 'react';
import Confirmation from './Confirmation'; // নতুন ক্লায়েন্ট কম্পোনেন্টটি ইমপোর্ট করুন
import styles from './OrderSuccessPage.module.css'; // লোডারের জন্য স্টাইল

export default function OrderSuccessPage() {
  return (
    // এটি একটি সার্ভার কম্পোনেন্ট, যা ক্লায়েন্ট কম্পোনেন্ট লোড হওয়ার আগ পর্যন্ত fallback দেখাবে
    <Suspense fallback={<div className={styles.container}><div className={styles.loader}>Loading confirmation...</div></div>}>
      <Confirmation />
    </Suspense>
  );
}