// app/checkout/components/StripeWrapper.tsx
'use client';

import { PaymentElement } from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css'; // PaymentMethods-এর CSS ব্যবহার করা হচ্ছে

// TypeScript ইন্টারফেস আপডেট করা হয়েছে
interface StripeWrapperProps {
  // clientSecret এখন আর এখানে প্রয়োজন নেই, কারণ এটি Elements প্রোভাইডারে পাস করা হয়
  children: React.ReactNode; // "Place Order" বাটনটি children হিসেবে আসবে
}

export default function StripeWrapper({ children }: StripeWrapperProps) {
  
  // StripeWrapper-এর একমাত্র কাজ হলো PaymentElement এবং তার সাথে সম্পর্কিত বাটনকে দেখানো
  // এখানে আর Elements প্রোভাইডার বা clientSecret props-এর প্রয়োজন নেই

  return (
    <div>
      {/* Stripe-এর কার্ড ইনপুট ফর্ম (Klarna, Afterpay ইত্যাদিও এটি পরিচালনা করে) */}
      <PaymentElement 
        id="payment-element"
        options={{
          layout: 'tabs', // রেফারেন্স সাইটের মতো ট্যাব-ভিত্তিক লেআউট
        }}
      />
      
      {/* "Place Order" বাটনটি এখন এখানে রেন্ডার হবে */}
      <div className={styles.placeOrderContainer}>
        {children}
      </div>
    </div>
  );
}