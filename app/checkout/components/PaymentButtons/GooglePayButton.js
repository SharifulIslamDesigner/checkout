import React, { useState, useEffect } from 'react';
import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

const GooglePayButton = ({ total, onOrderPlace }) => {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe || total <= 0) return;

    // পেমেন্ট রিকোয়েস্ট অবজেক্ট তৈরি করা
    const pr = stripe.paymentRequest({
      country: 'AU',
      currency: 'aud',
      total: {
        label: 'Total',
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      disableWallets: ['applePay', 'link'], // শুধু Google Pay দেখানোর জন্য অন্যগুলো নিষ্ক্রিয় করুন
    });

    // ব্রাউজার সমর্থন করে কিনা তা পরীক্ষা করা
    pr.canMakePayment().then(result => {
      if (result && result.googlePay) {
        setPaymentRequest(pr);
      }
    });

    // পেমেন্ট সম্পন্ন হলে এই ফাংশনটি কাজ করবে
    pr.on('paymentmethod', async (ev) => {
      // এখানে আপনার সার্ভার থেকে clientSecret তৈরি এবং পেমেন্ট কনফার্ম করার লজিক থাকবে
      // ... (আমার আগের উত্তরের লজিক)
      // সফল হলে onOrderPlace কল হবে
      console.log('Payment Method received:', ev.paymentMethod);
      toast.success('Google Pay processing...');
      // ev.complete('success');
      // onOrderPlace({ transaction_id: 'some-id' });
    });

  }, [stripe, total, onOrderPlace]);

  if (paymentRequest) {
    return <PaymentRequestButtonElement options={{ paymentRequest }} />;
  }

  // বাটন প্রস্তুত না হলে কিছুই দেখাবে না বা লোডার দেখাতে পারেন
  return null;
};

export default GooglePayButton;