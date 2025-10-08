'use client';

import React, { useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';
import ExpressCheckouts from './ExpressCheckouts';
// ★ নতুন PayPal কম্পোনেন্ট ইম্পোর্ট করুন
import PayPalPaymentGateway from './PayPalPaymentGateway'; 

// --- TypeScript Interfaces (অপরিবর্তিত) ---
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

// --- Stripe Sub-Component (আপনার দেওয়া কোড অনুযায়ী অপরিবর্তিত) ---
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


// --- Main PaymentMethods Component (পরিবর্তিত) ---
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
      <ExpressCheckouts total={total} onOrderPlace={onPlaceOrder} />
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
            {/* ★ PayPal-এর কোড সরিয়ে নতুন কম্পোনেন্ট ব্যবহার করা হচ্ছে ★ */}
            <PayPalPaymentGateway 
              total={total}
              isPlacingOrder={isPlacingOrder}
              onPlaceOrder={(paymentData) => onPlaceOrder(paymentData)}
            />
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