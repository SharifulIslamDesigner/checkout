"use client"; // <-- এই পেজটি ক্লায়েন্ট কম্পোনেন্ট হওয়া জরুরি

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import styles from './OrderSuccessPage.module.css'; // <-- আমরা একটি নতুন CSS ফাইল তৈরি করব

export default function OrderSuccessPage() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    // URL-এ ?clear_cart=true আছে কিনা তা পরীক্ষা করা হচ্ছে
    const shouldClearCart = searchParams.get('clear_cart');

    if (shouldClearCart === 'true') {
      console.log("Order success signal received, clearing cart...");
      clearCart();
    }
    
    // এই ইফেক্টটি শুধু একবারই রান হওয়া উচিত
  }, []); // <-- খালি dependency array

  return (
    <div className={styles.container}>
      <div className={styles.successBox}>
        <div className={styles.iconWrapper}>
          ✓
        </div>
        <h1 className={styles.title}>Thank You For Your Order!</h1>
        <p className={styles.message}>
          Your order has been placed successfully. A confirmation email has been sent to you.
        </p>
        <div className={styles.buttonGroup}>
          <Link href="/products" className={styles.primaryButton}>
            Continue Shopping
          </Link>
          <Link href="/account" className={styles.secondaryButton}>
            View My Account
          </Link>
        </div>
      </div>
    </div>
  );
}