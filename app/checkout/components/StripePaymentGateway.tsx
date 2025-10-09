'use client';

import React, { useState, forwardRef} from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';

// --- TypeScript Interfaces ---
interface CustomerInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postcode?: string;
}
interface StripePaymentGatewayProps {
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: { transaction_id?: string }) => Promise<void>;
  customerInfo: CustomerInfo;
  total: number; 
}

// --- মূল ফর্ম কম্পোনেন্ট ---
const StripeForm = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  ({ selectedPaymentMethod, onPlaceOrder, customerInfo, total }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isProcessing) return;
      setIsProcessing(true);
      toast.loading('Processing payment...');

      if (!stripe || !elements) {
        toast.dismiss();
        toast.error("Stripe is not initialized.");
        setIsProcessing(false);
        return;
      }
      const paymentMethodType = selectedPaymentMethod.replace('stripe_', '');
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          payment_method_types: [paymentMethodType === 'card' ? 'card' : paymentMethodType]
        }),
      });
      const { clientSecret, error: clientSecretError } = await res.json();

      if (clientSecretError) {
        toast.dismiss();
        toast.error(clientSecretError.message || "Could not create payment intent.");
        setIsProcessing(false);
        return;
      }

      let confirmationResult;
      const billingDetails = {
          name: `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: {
            line1: customerInfo.address1,
            city: customerInfo.city,
            state: customerInfo.state,
            postal_code: customerInfo.postcode,
            country: 'AU',
          }
      };
      
      const returnUrl = `${window.location.origin}/order-success`;
      switch (paymentMethodType) {
        case 'card':
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            toast.dismiss();
            toast.error("Card details not found.");
            setIsProcessing(false);
            return;
          }
          confirmationResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement, billing_details: billingDetails }
          });
          break;
        case 'klarna':
          confirmationResult = await stripe.confirmKlarnaPayment(clientSecret, {
            payment_method: { billing_details: billingDetails },
            return_url: returnUrl,
          });
          break;
        case 'afterpay_clearpay':
          confirmationResult = await stripe.confirmAfterpayClearpayPayment(clientSecret, {
            payment_method: { billing_details: billingDetails },
            return_url: returnUrl,
          });
          break;
        default:
          toast.dismiss();
          toast.error("Unsupported payment method selected.");
          setIsProcessing(false);
          return;
      }
      
      toast.dismiss();
      const { error, paymentIntent } = confirmationResult;

      if (error) {
        toast.error(error.message || "An unexpected error occurred.");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment confirmed!');
        await onPlaceOrder({ transaction_id: paymentIntent.id });
      }
    };

    const renderPaymentUI = () => {
      const paymentMethodType = selectedPaymentMethod === 'stripe' ? 'card' : selectedPaymentMethod.replace('stripe_', '');
      
      switch (paymentMethodType) {
        case 'card':
          return (
            <div>
              <label className={styles.stripeLabel}>Card details</label>
              <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770' } }, hidePostalCode: true }} />
            </div>
          );
        case 'klarna':
          return (
            <div className={styles.paymentMethodInfo}>
              <p>You will be redirected to Klarna to complete your purchase securely after clicking `Place Order`.</p>
            </div>
          );
        case 'afterpay_clearpay':
          return (
            <div className={styles.paymentMethodInfo}>
              <p>You will be redirected to Afterpay to complete your purchase securely after clicking `Place Order`.</p>
            </div>
          );
        // Link এবং অন্যান্য পদ্ধতির জন্য আপনি এখানে UI যোগ করতে পারেন
        default:
          return <p>This payment method is not configured.</p>;
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit}>
        {renderPaymentUI()}
      </form>
    );
  }
);
StripeForm.displayName = 'StripeForm';


// --- মূল গেটওয়ে কম্পোনেন্ট যা Elements Provider র‍্যাপ করে ---
const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>((props, ref) => {
    const [stripePromise] = useState(() => 
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
            ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
            : null
    );

    if (!stripePromise) {
      return <div className={styles.loader}>Loading Stripe...</div>;
    }

    return (
      <Elements stripe={stripePromise}>
        <StripeForm ref={ref} {...props} />
      </Elements>
    );
});
StripePaymentGateway.displayName = 'StripePaymentGateway';

export default StripePaymentGateway;