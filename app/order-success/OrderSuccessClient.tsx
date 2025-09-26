"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import styles from './OrderSuccessPage.module.css';

// --- GTM-এর purchase ইভেন্টের জন্য টাইপ ডেফিনিশন ---
interface GTMItem {
  item_id: number;
  item_name: string;
  price: number;
  quantity: number;
}
interface PurchaseData {
  transaction_id: string;
  value: number;
  currency: string;
  items: GTMItem[];
}
interface WindowWithDataLayer extends Window {
    dataLayer?: unknown[];
}


export default function OrderSuccessClient() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    const shouldClearCart = searchParams.get('clear_cart');
    const orderDataParam = searchParams.get('order_data');

    // GTM purchase ইভেন্ট পাঠানো হচ্ছে
    if (orderDataParam) {
      try {
        const decodedData = decodeURIComponent(orderDataParam);
        const purchaseData: PurchaseData = JSON.parse(decodedData);
        
        const safeWindow = window as WindowWithDataLayer;
        safeWindow.dataLayer = safeWindow.dataLayer || [];
        safeWindow.dataLayer.push({
          event: 'purchase',
          ecommerce: {
            transaction_id: purchaseData.transaction_id,
            value: purchaseData.value,
            currency: purchaseData.currency,
            items: purchaseData.items,
          }
        });

        console.log("Purchase event sent to GTM:", purchaseData);

      } catch (error) {
        console.error("Failed to parse order data for GTM:", error);
      }
    }
    
    // কার্ট খালি করা হচ্ছে
    if (shouldClearCart === 'true') {
      console.log("Order success signal received, clearing cart...");
      clearCart();
      // URL থেকে প্যারামিটারগুলো সরিয়ে ফেলা হচ্ছে
      window.history.replaceState(null, '', window.location.pathname);
    }
    
  }, [searchParams, clearCart]);

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