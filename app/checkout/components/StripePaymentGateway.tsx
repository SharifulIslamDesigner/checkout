'use client';

import React, { useState, forwardRef, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import styles from './PaymentMethods.module.css';

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

const StripeForm = forwardRef<HTMLFormElement, StripePaymentGatewayProps & { clientSecret?: string }>(
  ({ selectedPaymentMethod, onPlaceOrder, customerInfo, total, clientSecret }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isProcessing || !stripe || !elements) return;
      
      setIsProcessing(true);
      toast.loading('Processing payment...');

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

      if (selectedPaymentMethod === 'stripe') {
        if (!clientSecret) {
            toast.dismiss();
            toast.error("Could not initialize card payment. Please try again.");
            setIsProcessing(false);
            return;
        }

        const { error: submitError } = await elements.submit();
        if (submitError) {
          toast.dismiss();
          toast.error(submitError.message || "Please check your payment details.");
          setIsProcessing(false);
          return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: returnUrl,
          },
          redirect: 'if_required',
        });
        
        toast.dismiss();
        if (error) {
          toast.error(error.message || "An unexpected error occurred.");
        } else if (paymentIntent?.status === 'succeeded') {
          toast.success('Payment confirmed!');
          await onPlaceOrder({ transaction_id: paymentIntent.id });
        }
        setIsProcessing(false);
        return;
      }
      
      const paymentMethodType = selectedPaymentMethod.replace('stripe_', '');
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          payment_method_types: [paymentMethodType],
        }),
      });

      const { clientSecret: redirectClientSecret, error: piError } = await res.json();

      if (piError) {
        toast.dismiss();
        toast.error(piError.message || "Could not create payment intent.");
        setIsProcessing(false);
        return;
      }

      let confirmationResult;

      if (selectedPaymentMethod === 'stripe_klarna') {
        confirmationResult = await stripe.confirmKlarnaPayment(redirectClientSecret, {
          payment_method: { billing_details: billingDetails },
          return_url: returnUrl,
        });
      } else if (selectedPaymentMethod === 'stripe_afterpay_clearpay') {
        confirmationResult = await stripe.confirmAfterpayClearpayPayment(redirectClientSecret, {
          payment_method: { billing_details: billingDetails },
          return_url: returnUrl,
        });
      }

      if (confirmationResult?.error) {
        toast.dismiss();
        toast.error(confirmationResult.error.message || "An unexpected error occurred.");
        setIsProcessing(false);
      }
    };

    const renderPaymentUI = () => {
      if (selectedPaymentMethod === 'stripe') {
        return (
          <div className={styles.cardElementContainer}>
            <PaymentElement />
          </div>
        );
      }
      
      if (selectedPaymentMethod.includes('klarna') || selectedPaymentMethod.includes('afterpay')) {
        return (
          <div className={styles.paymentMethodInfo}>
            <p>You will be redirected to complete your purchase securely after clicking `Place Order`.</p>
          </div>
        );
      }

      return <p>This payment method is not configured.</p>;
    };

    return <form ref={ref} onSubmit={handleSubmit}>{renderPaymentUI()}</form>;
  }
);
StripeForm.displayName = 'StripeForm';

const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>((props, ref) => {
    const [stripePromise] = useState(() => 
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
            ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
            : null
    );
    const [clientSecret, setClientSecret] = useState<string>('');
    
    useEffect(() => {
        if (props.selectedPaymentMethod === 'stripe' && props.total > 0) {
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: Math.round(props.total * 100) })
            })
            .then(res => res.json())
            .then(data => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                }
            });
        }
    }, [props.total, props.selectedPaymentMethod]);

    if (!stripePromise) {
        return <div className={styles.loader}>Loading Stripe...</div>;
    }

    if (props.selectedPaymentMethod === 'stripe') {
        if (!clientSecret) {
            return <div className={styles.loader}>Initializing Card Payment...</div>;
        }
        return (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripeForm ref={ref} {...props} clientSecret={clientSecret} />
            </Elements>
        );
    }
    
    return (
        <Elements stripe={stripePromise}>
            <StripeForm ref={ref} {...props} />
        </Elements>
    );
});
StripePaymentGateway.displayName = 'StripeGateway';

export default StripePaymentGateway;