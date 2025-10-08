'use client';

import React, { useEffect, useState, forwardRef, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';

// --- TypeScript Interface ---
interface StripePaymentGatewayProps {
  total: number;
  onPlaceOrder: (paymentData?: { transaction_id?: string; }) => Promise<void>;
  isPlacingOrder: boolean;
}

// --- Stripe Checkout Form Sub-Component ---
const StripeCheckoutForm = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  ({ onPlaceOrder, isPlacingOrder }, ref) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!stripe || !elements || isPlacingOrder) {
        return;
      }
      
      toast.loading('Processing...');

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      toast.dismiss();

      if (error) {
        toast.error(error.message || "An unexpected error occurred.");
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment confirmed!');
        await onPlaceOrder({ transaction_id: paymentIntent.id });
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit}>
        <PaymentElement />
      </form>
    );
  }
);

StripeCheckoutForm.displayName = 'StripeCheckoutForm';


// --- Main Stripe Gateway Component ---
// --- Wrapper Component to use hooks ---
const StripeGatewayComponent = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  ({ total, onPlaceOrder, isPlacingOrder }, ref) => {
    
    // ★ useElements হুকটি এখানে ব্যবহার করতে হবে
    const elements = useElements(); 
    const paymentIntentIdRef = useRef<string | null>(null);

    useEffect(() => {
      // Amount যখন ০ এর বেশি হবে তখনই API কল হবে
      if (total > 0 && elements) {
        
        // যদি Payment Intent আগে থেকেই তৈরি করা থাকে, তাহলে এটিকে আপডেট করুন
        if (paymentIntentIdRef.current) {
          fetch('/api/update-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntentIdRef.current,
              amount: total, // নতুন মোট পরিমাণ পাঠান
            }),
          })
          .then(res => res.json())
          .then(async (data) => {
            if (data.success) {
              // ★★★ সবচেয়ে গুরুত্বপূর্ণ ধাপ ★★★
              // সার্ভারে PI আপডেট হওয়ার পর ক্লায়েন্টকে রিফ্রেশ করতে বলা
              const { error } = await elements.fetchUpdates();
              if (error) {
                console.error("Failed to fetch payment element updates:", error);
                toast.error("Could not update payment details.");
              }
            }
          })
          .catch(error => console.error("Update PI Error:", error));

        } 

        else {
          fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(total * 100) }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.clientSecret) {
              // clientSecret থেকে paymentIntentId বের করে ref-এ সেভ করুন
              const pi_id = data.clientSecret.split('_secret_')[0];
              paymentIntentIdRef.current = pi_id;
            
            }
          })
          .catch(error => {
            console.error("Create PI Error:", error);
            toast.error("Could not initialize the payment form.");
          });
        }
      }
    }, [total, elements]); // ★ elements-কে dependency হিসেবে যোগ করুন

    return <StripeCheckoutForm ref={ref} onPlaceOrder={onPlaceOrder} isPlacingOrder={isPlacingOrder} total={total} />;
  }
);

StripeGatewayComponent.displayName = 'StripeGatewayComponent';


// --- Main Stripe Gateway Component (পরিবর্তিত) ---
const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  ({ total, ...props }, ref) => {
    const [clientSecret, setClientSecret] = useState<string>('');
    const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
      ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
      : null;
    useEffect(() => {
      if (total > 0 && !clientSecret) {
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
    }, [total, clientSecret]);

    if (!clientSecret || !stripePromise) {
      return <div className={styles.loader}>Loading Payment Form...</div>;
    }

    return (
      <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
        <StripeGatewayComponent ref={ref} total={total} {...props} />
      </Elements>
    );
  }
);

StripePaymentGateway.displayName = 'StripePaymentGateway';

export default StripePaymentGateway;