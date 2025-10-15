// app/order-confirmation/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext'; // আপনার কার্ট কনটেক্সট এর সঠিক পাথ দিন
import styles from './OrderConfirmation.module.css'; // ★ নতুন: CSS ফাইল ইম্পোর্ট করা হয়েছে

export default function OrderConfirmationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();

    const [message, setMessage] = useState('Verifying your payment, please wait...');
    const [error, setError] = useState('');

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const orderKey = searchParams.get('key');
        const paymentIntentId = searchParams.get('payment_intent');
        const clientSecret = searchParams.get('payment_intent_client_secret');

        if (!orderId || !paymentIntentId || !clientSecret || !orderKey) {
            setError('Invalid order confirmation URL. Could not verify payment.');
            setMessage(''); // সফল বার্তা মুছে দিন
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, paymentIntentId }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Payment verification failed.');
                }

                setMessage('Payment successful! Redirecting you now...');
                if (typeof clearCart === 'function') {
                    await clearCart();
                }
                
                // একটি ছোট ডিলে যোগ করা যেতে পারে যাতে ব্যবহারকারী বার্তাটি পড়তে পারে
                setTimeout(() => {
                    router.replace(`/order-success?order_id=${orderId}&key=${orderKey}`);
                }, 3000); // ১ সেকেন্ড পর রিডাইরেক্ট হবে

            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(`There was a problem with your order: ${errorMessage}`);
                setMessage('');
            }
        };

        verifyPayment();

    }, [searchParams, router, clearCart]);

    // ★★★ পরিবর্তন: JSX আপডেট করে নতুন স্টাইল এবং লোডার যোগ করা হয়েছে ★★★
    return (
        <div className={styles.container}>
            {!error && (
                <>
                    <div className={styles.loader}></div>
                    <h1 className={styles.title}>{message}</h1>
                </>
            )}
            {error && (
                <p className={styles.error}>{error}</p>
            )}
        </div>
    );
}