'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : null;

export default function ExpressCheckouts({ total }: { total: number }) {
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
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      });
    }
  }, [total]);

  if (!clientSecret || !stripePromise) {
    return <div className={styles.expressCheckoutLoader}></div>;
  }

  return (
    <div className={styles.expressCheckoutContainer}>
      <Elements options={{ clientSecret }} stripe={stripePromise}>
        <ExpressCheckoutElement onConfirm={() => {}} />
      </Elements>
    </div>
  );
}