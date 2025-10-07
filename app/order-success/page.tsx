// app/order-success/page.tsx

// --- সমাধান: ক্লায়েন্ট কম্পোনেন্ট হিসেবে রেন্ডার করা হচ্ছে ---
// এটি সার্ভার-সাইড `searchParams` সম্পর্কিত যেকোনো সম্ভাব্য সমস্যা এড়িয়ে যায়
// এবং ক্লায়েন্ট-সাইড রিডাইরেকশনের সাথে মসৃণভাবে কাজ করে।
'use client'; 

import { useSearchParams } from 'next/navigation';
import OrderSuccessClient from './OrderSuccessClient';
import styles from './OrderSuccessPage.module.css';

// এটি এখন একটি ক্লায়েন্ট কম্পোনেন্ট
export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const order_id = searchParams.get('order_id');
  const key = searchParams.get('key');

  // যদি URL-এ order_id বা key না থাকে, তাহলে একটি এরর 메시지 দেখানো হবে
  if (!order_id || !key) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h1>Invalid Order Confirmation URL</h1>
          <p>We could not find the order you are looking for. Please check the link or contact our support.</p>
        </div>
      </div>
    );
  }

  // order_id এবং key ক্লায়েন্ট কম্পোনেন্টে পাস করা হচ্ছে
  return (
    <div className={styles.container}>
      <OrderSuccessClient orderId={order_id} orderKey={key} />
    </div>
  );
}