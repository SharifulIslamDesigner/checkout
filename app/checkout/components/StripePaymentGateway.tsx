// app/checkout/components/StripePaymentGateway.tsx

import React, { useState, forwardRef, useEffect } from 'react';
import Image from 'next/image';
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

interface ShippingFormData {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
  email: string;
  phone: string;
}

interface StripePaymentGatewayProps {
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string;
    shippingAddress?: Partial<ShippingFormData>; 
    redirect_needed?: boolean;
  }) => Promise<{ orderId: number, orderKey: string } | void | null>;
  customerInfo: CustomerInfo;
  total: number;
}

const StripeForm = forwardRef<HTMLFormElement, StripePaymentGatewayProps & { clientSecret?: string }>(
  ({ selectedPaymentMethod, onPlaceOrder, customerInfo, total, clientSecret }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [internalStripeMethod, setInternalStripeMethod] = useState<string>('card');

    // ★★★ কোড আপডেট করা হয়েছে ★★★
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

      // --- চূড়ান্ত সিদ্ধান্ত গ্রহণকারী লজিক ---
      const isStandaloneRedirect = selectedPaymentMethod === 'stripe_klarna' || selectedPaymentMethod === 'stripe_afterpay_clearpay';
      const isRedirectFromElement = selectedPaymentMethod === 'stripe' && (internalStripeMethod === 'klarna' || internalStripeMethod === 'afterpay_clearpay');
      const isRedirectFlow = isStandaloneRedirect || isRedirectFromElement;

      // ★★★ পথ ১: Redirect ফ্লো (Klarna/Afterpay - উভয় উৎস থেকে) ★★★
      if (isRedirectFlow) {
        try {
          // ধাপ ১: REST API দিয়ে পেন্ডিং অর্ডার তৈরি করুন
          const orderDetails = await onPlaceOrder({ redirect_needed: true });
          if (!orderDetails || !orderDetails.orderId || !orderDetails.orderKey) {
            throw new Error("Could not create a pending order.");
          }

          // ধাপ ২: Payment Intent তৈরি করুন
          const paymentMethodType = isStandaloneRedirect ? selectedPaymentMethod.replace('stripe_', '') : internalStripeMethod;
          const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: Math.round(total * 100),
              payment_method_types: [paymentMethodType],
              metadata: { order_id: orderDetails.orderId }
            }),
          });
          const { clientSecret: redirectClientSecret, error: piError } = await res.json();
          if (piError) { throw new Error(piError.message || "Could not create payment intent."); }

          // ধাপ ৩: Redirect করুন
          const returnUrl = `${window.location.origin}/order-success?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;
          let confirmationResult;

          if (paymentMethodType === 'klarna') {
            confirmationResult = await stripe.confirmKlarnaPayment(redirectClientSecret, {
              payment_method: { billing_details: billingDetails },
              return_url: returnUrl,
            });
          } else if (paymentMethodType === 'afterpay_clearpay') {
            confirmationResult = await stripe.confirmAfterpayClearpayPayment(redirectClientSecret, {
              payment_method: { billing_details: billingDetails },
              return_url: returnUrl,
            });
          }

          if (confirmationResult?.error) {
            throw new Error(confirmationResult.error.message);
          }
          // সফল রিডাইরেক্টের পর এখানে কোড এক্সিকিউট হবে না, তাই isProcessing রিসেট করার দরকার নেই।
          
        } catch (error: unknown) { // ধাপ ১: টাইপকে unknown হিসেবে ঘোষণা করুন
          toast.dismiss();
  
          let errorMessage = "An unexpected error occurred.";

          // ধাপ ২: error আসলেই একটি Error অবজেক্ট কিনা তা পরীক্ষা করুন
          if (error instanceof Error) {
            errorMessage = error.message; // এখন error.message ব্যবহার করা নিরাপদ
          }
  
          toast.error(errorMessage);
          setIsProcessing(false);
        }
      } 
      
      // ★★★ পথ ২: Direct Payment ফ্লো (Card, Link, GPay, Zip ইত্যাদি) ★★★
      else if (selectedPaymentMethod === 'stripe') {
        if (!clientSecret) {
          toast.dismiss();
          toast.error("Could not initialize payment. Please try again.");
          setIsProcessing(false);
          return; // clientSecret না থাকলে এখানেই শেষ
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
            return_url: `${window.location.origin}/order-success`,
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
      }
      
      // ★★★ যদি কোনো সমর্থিত মেথড না হয় ★★★
      else {
        toast.dismiss();
        toast.error("This payment method is not configured correctly.");
        setIsProcessing(false);
      }
    };

    const renderPaymentUI = () => {
      if (selectedPaymentMethod === 'stripe') {
        return (
          <div className={styles.cardElementContainer}>
            <PaymentElement onChange={(e) => setInternalStripeMethod(e.value.type)} />
          </div>
        );
      }
      
      if (selectedPaymentMethod === 'stripe_klarna') {
        const installment = (total / 4).toFixed(2);
        return (
          <div className={styles.redirectInfoBox}>
            <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={40} height={20} />
             <div className={styles.infoText}>
               <span>Pay now, or in 4 interest-free payments of <strong>A${installment}</strong>. <a href="https://www.klarna.com/au/payments/pay-in-4/" target="_blank" rel="noopener noreferrer">Learn more</a></span>
               <small>After submission, you will be redirected to securely complete next steps.</small>
              </div>
         </div>
        );
      }
  
      if (selectedPaymentMethod === 'stripe_afterpay_clearpay') {
        const installment = (total).toFixed(2);
        return (
         <div className={styles.redirectInfoBox}>
            <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={60} height={20} unoptimized/>
            <div className={styles.infoText}>
              <span>Pay <strong>A${installment}</strong> -<strong>You can pay Up to 2000AUD</strong>-After submission, you will be redirected to securely complete next steps.</span>
            </div>
          </div>
        );
      }

      return null;
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
            if (clientSecret) return;
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: Math.round(props.total * 100),
                    
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else if (data.error) {
                    toast.error(data.error.message || 'Could not initialize payment options.');
                }
            });
        }
    }, [props.total, props.selectedPaymentMethod, clientSecret]);

    if (!stripePromise) {
        return <div className={styles.loader}>Loading Stripe...</div>;
    }

    if (props.selectedPaymentMethod === 'stripe') {
        if (!clientSecret) {
            return <div className={styles.loader}>Initializing Payment Options...</div>;
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