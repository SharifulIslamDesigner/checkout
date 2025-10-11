// app/checkout/components/GooglePayButton.tsx
'use client';

import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js'; // FUNDING-এর আর প্রয়োজন নেই
import toast from 'react-hot-toast';

interface GooglePayButtonProps {
  total: number;
  isPlacingOrder: boolean;
  onPlaceOrder: (paymentData: { transaction_id: string }) => Promise<void>;
}

export default function GooglePayButton({ total, isPlacingOrder, onPlaceOrder }: GooglePayButtonProps) {

  if (total <= 0) {
    return null;
  }

  // ★★★ সমাধান: এটি এখন শুধুমাত্র একটি সাধারণ PayPal বাটন,
  // কিন্তু PayPal নিজে থেকেই Google Pay অপশনটি দেখাবে (যদি সম্ভব হয়)
  return (
    <div style={{ paddingTop: '8px' }}>
      <PayPalButtons
        key={total}
        // fundingSource প্রপটি এখান থেকে সম্পূর্ণ মুছে ফেলা হয়েছে
        style={{
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          height: 48,
          tagline: false, // "Pay with" লেখাটি লুকানোর জন্য (ঐচ্ছিক)
        }}
        disabled={isPlacingOrder}
        forceReRender={[total]}
        createOrder={(_, actions) => {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              amount: {
                currency_code: "AUD",
                value: total.toFixed(2),
              }
            }]
          });
        }}
        onApprove={async (_, actions) => {
          if (actions.order) {
            const details = await actions.order.capture();
            toast.success('Payment completed!');
            if (details && details.id) {
              await onPlaceOrder({ transaction_id: details.id });
            } else {
              toast.error("Could not verify the transaction.");
            }
          } else {
            toast.error("Could not capture the order.");
          }
        }}
        onError={(err) => {
          console.error("PayPal/Google Pay transaction failed:", err);
          toast.error("A payment error occurred. Please try again.");
        }}
      />
    </div>
  );
}