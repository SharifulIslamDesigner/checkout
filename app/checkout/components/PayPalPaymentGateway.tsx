//app/checkout/components/PaypalPaymentGateway.tsx

'use client';

import React from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
interface PayPalGatewayProps {
  total: number;
  isPlacingOrder: boolean;
  onPlaceOrder: (paymentData: { transaction_id: string }) => Promise<void>;
}

export default function PayPalPaymentGateway({ total, isPlacingOrder, onPlaceOrder }: PayPalGatewayProps) {
  return (
    
      <PayPalButtons
        style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        disabled={isPlacingOrder || total <= 0}
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
              toast.error("Could not verify the transaction. Please contact support.");
            }
            
          } else {
            toast.error("Could not capture the PayPal order.");
          }
        }}
        onError={(err) => {
          console.error("PayPal transaction failed:", err);
          toast.error("A PayPal error occurred. Please try again.");
        }}
      />
    
  );
}