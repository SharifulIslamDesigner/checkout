'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : null;

// Stripe-এর মূল Wrapper কম্পোনেন্ট
export default function StripePayment({ total }: { total: number }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (total > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      })
      .then(res => res.json())
      .then(data => {
        if(data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      });
    }
  }, [total]);

  if (!clientSecret || !stripePromise) {
    return <div className={styles.loader}>Loading Payment Options...</div>;
  }

  // ★★★ মূল সমাধান: ডিফল্ট মান সেট করার সঠিক পদ্ধতি ★★★
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const, // TypeScript এর জন্য const হিসেবে declare করা
    },
    // PaymentElement-এর ভেতরে ডিফল্ট মানগুলো পাস করা হয়
    fields: {
      billingDetails: {
        address: {
          country: 'AU' as const, // Australia
        },
      },
    },
  };

  return (
    <div className={styles.stripeWrapper}>
      {/* 'options' prop-এ এখন fields সহ অবজেক্টটি পাস করা হচ্ছে */}
      <Elements options={options} stripe={stripePromise}>
        {/* PaymentElement এখন ডিফল্ট কান্ট্রি সহ রেন্ডার হবে */}
        <PaymentElement id="payment-element" />
      </Elements>
    </div>
  );
}