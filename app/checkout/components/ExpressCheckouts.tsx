'use client';
import React, { useState, useEffect } from 'react'; // <--- এই লাইনটি পরিবর্তন করুন

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css';

// আপনার স্বতন্ত্র বাটন কম্পোনেন্টগুলো ইম্পোর্ট করুন
import GooglePayButton from './PaymentButtons/GooglePayButton';
import LinkButton from './PaymentButtons/LinkButton';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : null;

interface ExpressCheckoutsProps {
  total: number;
  onOrderPlace: (paymentData: { transaction_id: string }) => Promise<void>;
}

export default function ExpressCheckouts({ total, onOrderPlace }: ExpressCheckoutsProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // WooCommerce-এর মতো, আপনি এখানে আপনার সেটিংস থেকে ঠিক করবেন কোন বাটনগুলো দেখাবেন
  const showGooglePay = true;
  const showLink = true;

  useEffect(() => {
    // পেমেন্ট ইন্টেন্ট তৈরি করার জন্য আপনার API কল
    if (total > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      });
    }
  }, [total]);

  if (!stripePromise || !clientSecret) {
    return <div className={styles.expressCheckoutLoader}></div>;
  }
  
  const stripeOptions = {
    clientSecret,
  };

  return (
    <div className={styles.expressCheckoutContainer}>
      <Elements stripe={stripePromise} options={stripeOptions}>
        
        {showLink && <LinkButton onConfirm={() => console.log('Link confirmed')} />}
        
        {showGooglePay && <GooglePayButton total={total} onOrderPlace={onOrderPlace} />}
        
      </Elements>
      <div className={styles.orSeparator}>— OR —</div>
    </div>
  );
}
