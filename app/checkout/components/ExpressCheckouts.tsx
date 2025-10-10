'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentRequestButtonElement, // ExpressCheckoutElement এর পরিবর্তে এটি ইম্পোর্ট করুন
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import styles from './PaymentMethods.module.css';
import toast from 'react-hot-toast';

// আপনার Stripe Publishable Key দিয়ে stripePromise লোড করুন
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface ExpressCheckoutsProps {
  total: number;
  onOrderPlace: (paymentData: { transaction_id: string }) => Promise<void>;
}

// মূল ফর্ম কম্পোনেন্ট
const GooglePayForm = ({ total, onOrderPlace }: ExpressCheckoutsProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState(null);

  // পেমেন্ট ইন্টেন্ট ম্যানেজ করার জন্য একটি ফাংশন
  const managePaymentIntent = async (amount) => {
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });
      const data = await res.json();
      if (!data.clientSecret) {
        throw new Error('Failed to get client secret from server.');
      }
      return data.clientSecret;
    } catch (error) {
      console.error("Failed to create Payment Intent:", error);
      toast.error('Could not initialize payment.');
      return null;
    }
  };


  useEffect(() => {
    // Stripe এবং total লোড না হলে কিছুই করবেনা
    if (!stripe || total <= 0) {
      return;
    }

    // একটি পেমেন্ট রিকোয়েস্ট অবজেক্ট তৈরি করুন
    const pr = stripe.paymentRequest({
      country: 'AU', // আপনার ব্যবসার দেশ অনুযায়ী পরিবর্তন করুন
      currency: 'aud', // আপনার কারেন্সি অনুযায়ী পরিবর্তন করুন
      total: {
        label: 'Total',
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // ব্রাউজার পেমেন্ট সমর্থন করে কিনা তা পরীক্ষা করুন
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    // পেমেন্ট সফলভাবে সম্পন্ন হলে এই ইভেন্টটি কাজ করবে
    pr.on('paymentmethod', async (ev) => {
      // প্রথমে একটি পেমেন্ট ইন্টেন্ট তৈরি করুন
      const clientSecret = await managePaymentIntent(total);
      if (!clientSecret) {
        ev.complete('fail');
        return;
      }

      // পেমেন্ট ইন্টেন্ট কনফার্ম করুন
      const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );

      if (confirmError) {
        ev.complete('fail');
        toast.error(confirmError.message || 'Payment failed.');
      } else {
        ev.complete('success');
        if (paymentIntent.status === 'succeeded') {
           toast.success('Payment Successful!');
           await onOrderPlace({ transaction_id: paymentIntent.id });
        }
      }
    });
  }, [stripe, total, onOrderPlace]);

  // paymentRequest থাকলে বাটনটি রেন্ডার করুন
  if (paymentRequest) {
    return (
      <div className={styles.googlePayButtonContainer}>
        <PaymentRequestButtonElement options={{ paymentRequest }} />
      </div>
    );
  }

  // বাটন প্রস্তুত না হলে একটি লোডার বা কিছুই না দেখান
  return <div className={styles.expressCheckoutLoader}></div>;
};

// Wrapper কম্পোনেন্ট
export default function ExpressCheckouts({ total, onOrderPlace }: ExpressCheckoutsProps) {
  if (!stripePromise) {
    return <div className={styles.expressCheckoutLoader}>Loading...</div>;
  }

  return (
    <div className={styles.expressCheckoutContainer}>
      {/* এখানে key হিসেবে total দিলে, দাম পরিবর্তন হলে কম্পোনেন্ট রি-রেন্ডার হবে */}
      <Elements stripe={stripePromise} key={total}>
        <GooglePayForm total={total} onOrderPlace={onOrderPlace} />
      </Elements>
      <div className={styles.orSeparator}>— OR —</div>
    </div>
  );
}