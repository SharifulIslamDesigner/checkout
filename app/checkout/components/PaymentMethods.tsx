'use client';

import React, { useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';
import ExpressCheckouts from './ExpressCheckouts';

// --- TypeScript Interfaces (No changes) ---
interface PaymentGateway { id: string; title: string; description: string; }
interface PaymentMethodsProps {
  gateways: PaymentGateway[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { transaction_id?: string; }) => Promise<void>;
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  total: number;
  [key: string]: any;
}

// --- Stripe Sub-Component (No changes) ---
const StripeForm = React.forwardRef<HTMLFormElement, any>(({ total, onPlaceOrder, isPlacingOrder }, ref) => {
  const [clientSecret, setClientSecret] = React.useState('');
  const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

  React.useEffect(() => {
    if (total > 0) {
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(total * 100) }),
      })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret));
    }
  }, [total]);

  if (!clientSecret || !stripePromise) return <div className={styles.loader}>Loading Payment Form...</div>;

  const StripePaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!stripe || !elements || isPlacingOrder) return;
      toast.loading('Processing...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      toast.dismiss();
      if (error) {
        toast.error(error.message || "An error occurred.");
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
  };
  return (
    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
      <StripePaymentForm />
    </Elements>
  );
});
StripeForm.displayName = 'StripeForm';

// --- Main PaymentMethods Component ---
export default function PaymentMethods(props: PaymentMethodsProps) {
  const { gateways, selectedPaymentMethod, onPaymentMethodChange, total, onPlaceOrder, isPlacingOrder, isShippingSelected } = props;
  const stripeFormRef = useRef<HTMLFormElement>(null);

  const getGatewayIcon = (id: string) => {
    if (id.includes('paypal') || id.includes('ppcp')) return 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png';
    if (id.includes('stripe')) return 'https://checkout.stripe.com/img/v3/checkout/_next/static/media/cards.55328b8e.svg';
    return '';
  };

  const handlePlaceOrderClick = () => {
    if (selectedPaymentMethod.includes('stripe')) {
      stripeFormRef.current?.requestSubmit();
    } else {
      onPlaceOrder();
    }
  };

  const isPayPalSelected = selectedPaymentMethod.includes('paypal') || selectedPaymentMethod.includes('ppcp');

  return (
    <div className={styles.paymentContainer}>
      <ExpressCheckouts total={total} />
      <div className={styles.orSeparator}>— OR —</div>
      <div className={styles.gatewayList}>
        {gateways.map(gateway => (
          <div key={gateway.id} className={styles.gatewayWrapper}>
            <div className={styles.gatewayOption} onClick={() => onPaymentMethodChange(gateway.id)}>
              <input type="radio" id={gateway.id} name="payment_method" value={gateway.id} checked={selectedPaymentMethod === gateway.id} readOnly />
              <label htmlFor={gateway.id}>{gateway.title}</label>
              {getGatewayIcon(gateway.id) && (
                <img src={getGatewayIcon(gateway.id)} alt={gateway.title} className={styles.gatewayIcon} />
              )}
            </div>
            {selectedPaymentMethod === gateway.id && (
              <div className={styles.gatewayDetails}>
                {(() => {
                  if (gateway.id.includes('stripe')) {
                    return <StripeForm ref={stripeFormRef} {...props} />;
                  } 
                  else if (gateway.description) {
                    return (
                      <div className={styles.offlinePayment}>
                        <p dangerouslySetInnerHTML={{ __html: gateway.description }} />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className={styles.finalActionArea}>
        {isPayPalSelected ? (
          <div className={styles.paypalContainer}>
            <PayPalScriptProvider options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
              currency: "AUD"
            }}>
              <PayPalButtons
                style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
                disabled={isPlacingOrder || total <= 0}
                forceReRender={[total]}
                createOrder={(_, actions) => {
                  return actions.order.create({
                    // ★★★ সমাধান: 'intent' প্রপার্টি যোগ করা হয়েছে ★★★
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
                    await onPlaceOrder({ transaction_id: details.id });
                  } else {
                    toast.error("Could not capture the order.");
                  }
                }}
                onError={(err) => {
                  console.error("PayPal transaction failed:", err);
                  toast.error("PayPal transaction failed.");
                }}
              />
            </PayPalScriptProvider>
          </div>
        ) : selectedPaymentMethod ? (
          <button
            onClick={handlePlaceOrderClick}
            disabled={isPlacingOrder || !isShippingSelected}
            className={styles.placeOrderButton}
          >
            {isPlacingOrder ? 'Processing...' : 'Place Order'}
          </button>
        ) : null}
      </div>
    </div>
  );
}