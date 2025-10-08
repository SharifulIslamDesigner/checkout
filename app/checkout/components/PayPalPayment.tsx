'use client';

import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';

// --- TypeScript Interfaces for Props ---
interface PayPalPaymentProps {
  total: number;
  onPlaceOrder: (paymentData?: { transaction_id?: string; }) => Promise<void>;
  isPlacingOrder: boolean;
  currencyCode?: string;
}

export default function PayPalPayment({ total, onPlaceOrder, isPlacingOrder, currencyCode = "AUD" }: PayPalPaymentProps) {
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!paypalClientId) {
    return <p className={styles.errorText}>PayPal Client ID is missing.</p>;
  }
  if (total <= 0) {
    return null;
  }

  return (
    <div className={styles.paypalContainer}>
      <p>You will be redirected to PayPal to complete your purchase securely.</p>
      
      {/* ★★★ সমাধান: options অবজেক্টের কী 'clientId' (ক্যামেল কেস) হবে ★★★ */}
      <PayPalScriptProvider options={{ clientId: paypalClientId, currency: currencyCode, intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
          disabled={isPlacingOrder}
          forceReRender={[total, currencyCode]}

          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [{
                amount: {
                  currency_code: currencyCode,
                  value: total.toFixed(2),
                },
              }],
            });
          }}

          onApprove={async (data, actions) => {
            if (actions.order) {
                const details = await actions.order.capture();
                toast.success('Payment completed successfully!');
                await onPlaceOrder({ transaction_id: details.id });
            }
          }}

          onError={(err) => {
            console.error("PayPal Error:", err);
            toast.error("An error occurred with the PayPal transaction.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}