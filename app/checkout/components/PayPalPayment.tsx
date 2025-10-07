// app/checkout/components/PayPalPayment.tsx
'use client';

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import toast from 'react-hot-toast';

interface PayPalPaymentProps {
  total: number;
  onPlaceOrder: (paymentData: {
    paymentMethodId: string;
    transactionId: string;
  }) => Promise<void>;
}

// মূল বাটন কম্পোনেন্ট
function PayPalButtonComponent({ total, onPlaceOrder }: PayPalPaymentProps) {
  return (
    <div>
      <p>You will be redirected to PayPal to complete your purchase securely.</p>
      <PayPalButtons
        style={{ layout: "vertical" }}
        forceReRender={[total]}
        createOrder={async (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: total.toFixed(2),
                currency_code: "AUD",
              }
            }]
          });
        }}
        onApprove={async (data, actions) => {
          if (actions.order) {
            const details = await actions.order.capture();
            if (details && details.id) {
              toast.success(`Payment successful! Finalizing order...`);
              await onPlaceOrder({
                paymentMethodId: 'paypal',
                transactionId: details.id
              });
            } else {
              toast.error("Could not capture your PayPal payment.");
            }
          }
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          toast.error("An error occurred with your PayPal payment.");
        }}
        disabled={total <= 0}
      />
    </div>
  );
}

// Provider সহ এক্সপোর্ট করা হচ্ছে
export default function PayPalPayment(props: PayPalPaymentProps) {
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "AUD",
    intent: "capture",
  };

  if (!paypalOptions.clientId) {
    console.error("PayPal Client ID is not configured.");
    return <p>PayPal is currently unavailable.</p>;
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtonComponent {...props} />
    </PayPalScriptProvider>
  );
}