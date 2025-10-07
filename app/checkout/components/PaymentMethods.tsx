// app/checkout/components/PaymentMethods.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { gql } from '@apollo/client';
import client from '../../../lib/apolloClient';
import styles from './PaymentMethods.module.css';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import toast from 'react-hot-toast';

import StripeWrapper from './StripeWrapper';
import PayPalPayment from './PayPalPayment';
import PlaceholderPayment from './PlaceholderPayment';
import WooCommercePayment from './PlaceholderPayment';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// --- Interfaces and GraphQL Query ---
interface PaymentGateway { id: string; title: string; description: string; }
interface PaymentMethodsProps {
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { paymentMethodId?: string }) => Promise<void>;
  isPlacingOrder: boolean;
  total: number;
  isShippingSelected: boolean;
}
const GET_PAYMENT_GATEWAYS = gql`
  query GetPaymentGateways {
    paymentGateways {
      nodes {
        id
        title
        description
      }
    }
  }
`;

// --- Stripe-এর জন্য বিশেষ প্লেস অর্ডার বাটন ---
const StripePlaceOrderButton = ({ onPlaceOrder, isPlacingOrder, stripe, elements }: { 
  onPlaceOrder: () => Promise<void>, 
  isPlacingOrder: boolean,
  stripe: any,
  elements: any 
}) => {
  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!stripe || !elements) { toast.error("Payment form is not ready yet."); return; }
    await onPlaceOrder();
  };
  return (
    <button onClick={handleSubmit} disabled={!stripe || isPlacingOrder} className={styles.placeOrderButton}>
      {isPlacingOrder ? 'Processing...' : 'Place Order'}
    </button>
  );
};

export default function PaymentMethods({
  selectedPaymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isPlacingOrder,
  total,
  isShippingSelected,
}: PaymentMethodsProps) {
  
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const paymentIntentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchGateways = async () => {
      setIsLoading(true);
      try {
        const { data } = await client.query<{ paymentGateways: { nodes: PaymentGateway[] } }>({
          query: GET_PAYMENT_GATEWAYS, fetchPolicy: 'network-only'
        });
        const availableGateways = data?.paymentGateways?.nodes || [];
        setGateways(availableGateways);
        
        if (availableGateways.length > 0 && !selectedPaymentMethod) {
            const firstStandardGateway = availableGateways.find(gw => !gw.id.includes('express'));
            if(firstStandardGateway) {
                onPaymentMethodChange(firstStandardGateway.id);
            }
        }
      } catch(e) { console.error("Failed to fetch gateways:", e);
      } finally { setIsLoading(false); }
    };
    fetchGateways();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (total > 0) {
      if (!paymentIntentIdRef.current || clientSecret === null) {
        fetch('/api/create-payment-intent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total }),
        }).then(res => res.json()).then(data => {
          if (data.clientSecret) { setClientSecret(data.clientSecret); paymentIntentIdRef.current = data.clientSecret.split('_secret_')[0]; }
        });
      } else {
        fetch('/api/update-payment-intent', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId: paymentIntentIdRef.current, amount: total }),
        });
      }
    }
  }, [total, clientSecret]);

  const expressCheckoutOptions: StripeElementsOptions = {
    mode: 'payment', amount: Math.round(total * 100), currency: 'aud',
  };

  const onExpressConfirm = async () => {
    if (!isShippingSelected) { toast.error("Please select a shipping method before paying."); return; }
    await onPlaceOrder({ paymentMethodId: 'stripe_express_checkout' });
  };
  
  // ★★★ StripeWrapper-এর জন্য একটি বিশেষ কম্পোনেন্ট যা useStripe এবং useElements হুক ব্যবহার করতে পারে ★★★
  const StripePayment = () => {
    const stripe = useStripe();
    const elements = useElements();
    return <StripePlaceOrderButton onPlaceOrder={onPlaceOrder} isPlacingOrder={isPlacingOrder} stripe={stripe} elements={elements} />;
  };

  return (
    <div className={styles.paymentContainer}>
      {clientSecret && total > 0 && gateways.some(gw => gw.id.includes('stripe')) && (
        <div className={styles.expressCheckoutSection}>
          <Elements options={expressCheckoutOptions} stripe={stripePromise}>
              <ExpressCheckoutElement onConfirm={onExpressConfirm} />
          </Elements>
          <div className={styles.divider}>OR</div>
        </div>
      )}

      <div className={styles.paymentMethodsList}>
        {isLoading ? (
          <p className={styles.loadingSpinner}>Loading payment methods...</p>
        ) : gateways.length > 0 ? (
          gateways.map((gateway) => {
            if (gateway.id.includes('express')) return null;
            const isSelected = selectedPaymentMethod === gateway.id;
            const title = gateway.id === 'stripe' ? 'Credit / Debit Card' : gateway.title;

            return (
              <div key={gateway.id} className={styles.methodItem}>
                <label className={styles.methodLabel}>
                  <input type="radio" name="payment_method" checked={isSelected} onChange={() => onPaymentMethodChange(gateway.id)} className={styles.radioInput} />
                  <span className={styles.methodTitle}>{title}</span>
                </label>
                {isSelected && (
                  <div className={styles.methodContent}>
                    {(() => {
                      switch (gateway.id) {
                        case 'stripe':
                          return clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                              <StripeWrapper>
                                <StripePayment />
                              </StripeWrapper>
                            </Elements>
                          ) : <div>Initializing...</div>;

                        case 'PAYPAL':
                          return <PayPalPayment 
                                    total={total}
                                    onPlaceOrder={onPlaceOrder} 
                                  />;

                        case 'WOOCOMMERCE':
                          return <WooCommercePayment 
                                    methodDescription={gateway.description}
                                    onPlaceOrder={() => onPlaceOrder({ paymentMethodId: gateway.id })}
                                    isPlacingOrder={isPlacingOrder}
                                  />;
                        default:
                          return <WooCommercePayment methodTitle={gateway.title} methodDescription={gateway.description} onPlaceOrder={() => onPlaceOrder()} isPlacingOrder={isPlacingOrder} />;
                      }
                    })()}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className={styles.noMethodsMessage}>No payment methods available for your region.</p>
        )}
      </div>
    </div>
  );
}