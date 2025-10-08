'use client';

import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe } from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css';
import toast from 'react-hot-toast';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : null;

interface ExpressCheckoutsProps {
  total: number;
  onOrderPlace: (paymentData: { transaction_id: string }) => Promise<void>;
}

const CheckoutForm = ({ onOrderPlace, clientSecret }: { onOrderPlace: ExpressCheckoutsProps['onOrderPlace'], clientSecret: string }) => {
  const stripe = useStripe();

  const onConfirm = async () => {
    if (!stripe) {
      return;
    }
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Payment Successful!');
      await onOrderPlace({ transaction_id: paymentIntent.id });
    } else {
      const errorMessage = paymentIntent?.last_payment_error?.message || 'Payment failed. Please try another method.';
      toast.error(errorMessage);
    }
  };

  return <ExpressCheckoutElement onConfirm={onConfirm} />;
}

export default function ExpressCheckouts({ total, onOrderPlace }: ExpressCheckoutsProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  // ★★★ পরিবর্তন ১: কম্পোনেন্ট রি-মাউন্ট করার জন্য একটি স্টেট যোগ করা হলো ★★★
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    const managePaymentIntent = async () => {
      if (total <= 0) return;

      if (!paymentIntentId) {
        try {
          const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(total * 100) }),
          });
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.clientSecret.split('_secret_')[0]);
            // ★★★ পরিবর্তন ২: প্রথমবার লোড হওয়ার পরেও key সেট করা হলো ★★★
            setRemountKey(prevKey => prevKey + 1);
          }
        } catch (error) {
          console.error("Failed to create Express Payment Intent:", error);
        }
      } else {
        try {
          await fetch('/api/update-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId, amount: total }),
          });
          // ★★★ পরিবর্তন ৩: সফলভাবে আপডেট হওয়ার পর key পরিবর্তন করা হলো ★★★
          setRemountKey(prevKey => prevKey + 1);
        } catch (error) {
          console.error("Failed to update Express Payment Intent:", error);
        }
      }
    };

    managePaymentIntent();
  }, [total]); // এখন আর paymentIntentId ডিপেন্ডেন্সি হিসেবে রাখার দরকার নেই

  if (!clientSecret || !stripePromise) {
    return <div className={styles.expressCheckoutLoader}></div>;
  }

  return (
    <div className={styles.expressCheckoutContainer}>
      <Elements key={remountKey} options={{ clientSecret }} stripe={stripePromise}>
        <CheckoutForm onOrderPlace={onOrderPlace} clientSecret={clientSecret} />
      </Elements>
    </div>
  );
}