'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';
import Image from 'next/image';

interface StripeGatewayProps {
  total: number;
  selectedMethodId: string;
  // ★ নতুন: অর্ডার তৈরির জন্য একটি ফাংশন
  onPaymentSuccess: (transactionId: string) => void; 
}

// Stripe হুক ব্যবহার করার জন্য অভ্যন্তরীণ কম্পোনেন্ট
const StripeInternalForm = forwardRef((props: { selectedMethodId: string, onPaymentSuccess: (id: string) => void }, ref) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripeSubmit = async () => {
    if (!stripe || !elements) {
      toast.error("Stripe is not ready yet.");
      return; // এখানেই শেষ
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      toast.error(submitError.message || "Please check your payment details.");
      return; // এখানেই শেষ
    }
    
    // পেমেন্ট চূড়ান্ত করার জন্য Stripe-কে নির্দেশ দিন
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // ★ মূল অংশ: এই অপশনটি Stripe-কে সিদ্ধান্ত নিতে দেয়
      // কার্ডের জন্য: এখানেই পেমেন্ট শেষ করে দেবে
      // Klarna/Afterpay-এর জন্য: ব্যবহারকারীকে রিডাইরেক্ট করবে
      redirect: 'if_required', 
      confirmParams: {
        // রিডাইরেক্ট হলে ব্যবহারকারী এই পেজে ফিরে আসবে
        return_url: `${window.location.origin}/order-confirmation`,
      }
    });

    if (error) {
      // যদি কোনো কারণে পেমেন্ট ব্যর্থ হয়
      toast.error(error.message || "Payment failed.");
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // ★★★ যদি কার্ড পেমেন্ট সফল হয় এবং রিডাইরেক্ট না হয় ★★★
      // তাহলে Parent-কে জানান যে পেমেন্ট সফল হয়েছে এবং অর্ডার তৈরি করুন
      props.onPaymentSuccess(paymentIntent.id);
    }
    // যদি রিডাইরেক্ট হয়, তাহলে এই কোডটি আর চলবে না কারণ ব্যবহারকারী অন্য পেজে চলে যাবে।
  };

  // Parent কম্পোনেন্টকে এই ফাংশনটি ব্যবহারের অনুমতি দিন
  useImperativeHandle(ref, () => ({
    submit: handleStripeSubmit
  }));

  // UI অংশ
  return (
    <div>
      <PaymentElement />
      {props.selectedMethodId === 'stripe_klarna' && (
        <div className={styles.infoBox}>
          <Image src="/klarna-logo.svg" alt="Klarna" width={60} height={40}/>
          <p>You will be redirected to Klarna to complete your payment.</p>
        </div>
      )}
      {props.selectedMethodId === 'stripe_afterpay' && (
        <div className={styles.infoBox}>
          <Image src="/afterpay-logo.svg" alt="Afterpay" width={80} height={40}/>
          <p>You will be redirected to Afterpay to complete your payment.</p>
        </div>
      )}
    </div>
  );
});
StripeInternalForm.displayName = 'StripeInternalForm';


// মূল Stripe গেটওয়ে কম্পোনেন্ট (আপনার আগের মতোই)
const StripePaymentGateway = forwardRef((props: StripeGatewayProps, ref) => {
  const { total, selectedMethodId, onPaymentSuccess } = props;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise] = useState(() => process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null);

  useEffect(() => {
    // এই লজিকটি আগের মতোই স্বাধীনভাবে কাজ করবে
    const managePaymentIntent = async () => {
      if (total > 0) {
        if (!paymentIntentId) {
          const res = await fetch('/api/create-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: total }) });
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.clientSecret.split('_secret_')[0]);
          }
        } else {
          await fetch('/api/update-payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId, amount: total }) });
        }
      }
    };
    managePaymentIntent();
  }, [total, paymentIntentId]);

  if (!clientSecret || !stripePromise) {
    return <div className={styles.loader}>Initializing Secure Payment...</div>;
  }

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <StripeInternalForm ref={ref} selectedMethodId={selectedMethodId} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
});

StripePaymentGateway.displayName = 'StripePaymentGateway';
export default StripePaymentGateway;