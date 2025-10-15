// app/order-confirmation/page.tsx

import { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient'; // নতুন ক্লায়েন্ট কম্পোনেন্ট
import styles from './OrderConfirmation.module.css'; // লোডারের জন্য স্টাইল

export default function OrderConfirmationPage() {
  return (
    // Suspense বাউন্ডারি যোগ করা হয়েছে
    // ক্লায়েন্ট কম্পোনেন্ট লোড হওয়ার আগ পর্যন্ত fallback UI দেখানো হবে
    <Suspense fallback={
        <div className={styles.container}>
            <div className={styles.loader}></div>
            <h1 className={styles.title}>Loading Confirmation...</h1>
        </div>
    }>
      <OrderConfirmationClient />
    </Suspense>
  );
}