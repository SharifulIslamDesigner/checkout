// app/checkout/components/PlaceholderPayment.tsx
'use client';

import styles from './PaymentMethods.module.css'; // আমরা একই CSS ফাইল ব্যবহার করব

interface PlaceholderPaymentProps {
  methodTitle: string;
  methodDescription: string;
  onPlaceOrder: (paymentData?: { paymentMethodId?: string }) => Promise<void>;
  isPlacingOrder: boolean;
}

export default function PlaceholderPayment({
  methodDescription,
  onPlaceOrder,
  isPlacingOrder
}: PlaceholderPaymentProps) {
  
  return (
    <div className={styles.placeholderContainer}>
      {/* WooCommerce থেকে আসা নির্দেশনা দেখানো হচ্ছে */}
      <div 
        className={styles.methodDescription} 
        dangerouslySetInnerHTML={{ __html: methodDescription }} 
      />
      
      {/* WooCommerce-এর মেথডগুলোর জন্য নিজস্ব প্লেস অর্ডার বাটন */}
      <div className={styles.placeOrderContainer}>
        <button
          onClick={() => onPlaceOrder()}
          disabled={isPlacingOrder}
          className={styles.placeOrderButton}
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place order'}
        </button>
      </div>
    </div>
  );
}