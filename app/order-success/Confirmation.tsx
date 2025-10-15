//app/order-success/Comfirmation.tsx

'use client'; // এই ফাইলটিকে একটি ক্লায়েন্ট কম্পোনেন্ট হিসেবে চিহ্নিত করা হলো

import { useSearchParams } from 'next/navigation';
import OrderSuccessClient from './OrderSuccessClient';
import styles from './OrderSuccessPage.module.css';

export default function Confirmation() {
  const searchParams = useSearchParams();
  const order_id = searchParams.get('order_id');
  const key = searchParams.get('key');

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

  return (
    <div className={styles.container}>
      <OrderSuccessClient orderId={order_id} orderKey={key} />
    </div>
  );
}