'use client';

import React, { useState, useEffect } from 'react';
import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

const GooglePayButton = ({ total, onOrderPlace }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  // পেমেন্ট ইন্টেন্ট তৈরি করার ফাংশন (WooCommerce এটি AJAX handler-এ করে)
  const createPaymentIntent = async (amount) => {
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      });
      const data = await res.json();
      if (!data.clientSecret) throw new Error('Failed to get client secret.');
      return data.clientSecret;
    } catch (error) {
      console.error("Payment Intent creation failed:", error);
      toast.error('Could not initialize payment.');
      return null;
    }
  };


  useEffect(() => {
    // stripe লোড না হলে বা দাম শূন্য হলে কিছুই করবে না
    if (!stripe || total <= 0) {
      setPaymentRequest(null);
      return;
    }

    // WooCommerce-এর মতোই, আমরা একটি সম্পূর্ণ পেমেন্ট রিকোয়েস্ট অবজেক্ট তৈরি করব
    const pr = stripe.paymentRequest({
      country: 'AU',         // <-- নিশ্চিত করুন এটি আপনার Stripe অ্যাকাউন্টের দেশের সাথে মেলে
      currency: 'aud',      // <-- নিশ্চিত করুন এটি আপনার Stripe অ্যাকাউন্টের কারেন্সির সাথে মেলে
      total: {
        label: 'Your Shop Name Total', // আপনার দোকানের নাম দিতে পারেন
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: true, // <-- শিপিংয়ের জন্য এটি প্রয়োজন হতে পারে, এমনকি ভার্চুয়াল প্রোডাক্টের জন্যও
    });

    // আসল ডিবাগিং এখানেই
    pr.canMakePayment().then(result => {
      console.log('Final canMakePayment Check:', result);
      
      // WooCommerce যা করে: তারা সুনির্দিষ্টভাবে googlePay বা applePay প্রপার্টি চেক করে
      if (result && (result.googlePay || result.applePay)) {
        setPaymentRequest(pr);
      } else {
        setPaymentRequest(null); // যদি সাপোর্ট না করে, তাহলে স্টেট null করে দিন
      }
    });

    pr.on('paymentmethod', async (ev) => {
      // এই লজিকটি WooCommerce-এর মতোই কাজ করে
      const clientSecret = await createPaymentIntent(total);
      if (!clientSecret) {
        ev.complete('fail');
        return;
      }

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

  if (!paymentRequest) {
    // বাটন দেখানোর শর্ত পূরণ না হলে কিছুই রেন্ডার হবে না
    return null;
  }

  return (
    <div style={{ marginTop: '10px' }}> {/* সামান্য স্পেস যোগ করা হলো */}
      <PaymentRequestButtonElement options={{ paymentRequest }} />
    </div>
  );
};

export default GooglePayButton;