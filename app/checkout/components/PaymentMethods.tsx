//app/checkout/components/PaymentMethods.tsx

'use client';
import Image from 'next/image';
import React, { useRef } from 'react';
import styles from './PaymentMethods.module.css';
import ExpressCheckouts from './ExpressCheckouts';
import PayPalPaymentGateway from './PayPalPaymentGateway';
import StripePaymentGateway from './StripePaymentGateway'; 
import PayPalMessage from './PayPalMessage';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';


// --- TypeScript Interfaces ---
interface PaymentGateway {
  id: string;
  title: string;
  description: string;
}
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
interface PaymentMethodsProps {
  gateways: PaymentGateway[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string; 
    shippingAddress?: Partial<ShippingFormData>; 
    redirect_needed?: boolean; 
  }) => Promise<{ orderId: number; orderKey: string } | void | null>;
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  total: number;
  customerInfo: CustomerInfo;
}

export default function PaymentMethods(props: PaymentMethodsProps) {
  const { 
    gateways, 
    selectedPaymentMethod, 
    onPaymentMethodChange, 
    total, 
    onPlaceOrder, 
    isPlacingOrder, 
    isShippingSelected,
    customerInfo 
  } = props;

  const stripeFormRef = useRef<HTMLFormElement>(null);
  
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const initialOptions = {
    clientId: paypalClientId || "",
    currency: "AUD",
    intent: "capture",
    components: "buttons,messages,googlepay",
  };

  // ★★★ চূড়ান্ত সংশোধিত getGatewayIcon ফাংশন (অরিজিনাল ব্র্যান্ড লোগো সহ) ★★★
  const getGatewayIcon = (id: string): React.ReactNode => {
    // PayPal
    if (id.includes('ppcp-gateway')) {
      return <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={80} height={20} className={styles.gatewayIcon} unoptimized />;
    }
    // Klarna
    if (id.includes('klarna')) {
      return <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={50} height={20} className={styles.gatewayIcon} />;
    }
    // Afterpay
    if (id.includes('afterpay')) {
      return <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={80} height={20} className={styles.gatewayIcon} unoptimized />;
    }
    // Link
    // Card
    if (id.includes('stripe')) {
      return (
        <span className={styles.cardIcons}>
          <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={30} height={20} />
          <Image src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" width={30} height={20} />
          <Image src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies-uplift/product/images/Amex_Bluebox-Logo.png" alt="American Express" width={30} height={20} unoptimized />
        </span>
      );
    }
    return null;
  };
  const handlePlaceOrderClick = () => {
    if (selectedPaymentMethod.includes('stripe') && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
    } else {
      onPlaceOrder();
    }
  };
  //const isGooglePaySelected = selectedPaymentMethod === 'ppcp-google-pay';

  const isPayPalSelected = selectedPaymentMethod.includes('ppcp-gateway');
  const filteredGateways = gateways.filter(gateway => gateway.id !== 'stripe_link');

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className={styles.paymentContainer}>
      <ExpressCheckouts total={total} onOrderPlace={onPlaceOrder } />
      <PayPalMessage total={total} />
      <div className={styles.gatewayList}>
        {filteredGateways.map(gateway => (
          <div key={gateway.id} className={styles.gatewayWrapper}>
            <div className={styles.gatewayOption} onClick={() => onPaymentMethodChange(gateway.id)}>
              <input type="radio" id={gateway.id} name="payment_method" value={gateway.id} checked={selectedPaymentMethod === gateway.id} readOnly />
              <label htmlFor={gateway.id}>{gateway.title}</label>
              <div className={styles.iconContainer}>
                {getGatewayIcon(gateway.id)}
              </div>
            </div>
            {selectedPaymentMethod === gateway.id && gateway.id.includes('stripe') && (
              <div className={styles.gatewayDetails}>
                <StripePaymentGateway ref={stripeFormRef} selectedPaymentMethod={selectedPaymentMethod} onPlaceOrder={onPlaceOrder} customerInfo={customerInfo} total={total} />
              </div>
            )}
            {selectedPaymentMethod === gateway.id && !gateway.id.includes('stripe') && gateway.description && (
               <div className={styles.gatewayDetails}><div className={styles.offlinePayment}><p dangerouslySetInnerHTML={{ __html: gateway.description }} /></div></div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.finalActionArea}>
        {isPayPalSelected ? (
          // ★ যখন PayPal সিলেক্ট করা হবে, তখন PayPalPaymentGateway দেখানো হবে
          <div className={styles.paypalContainer}>
            <PayPalPaymentGateway
            key={selectedPaymentMethod}
              total={total}
              isPlacingOrder={isPlacingOrder}
              onPlaceOrder={onPlaceOrder}
            />
          </div>
        ) : (
          // ★ অন্য কোনো পেমেন্ট পদ্ধতি সিলেক্ট করা থাকলে সাধারণ "Place Order" বাটন দেখানো হবে
          selectedPaymentMethod && (
            <button
              onClick={handlePlaceOrderClick}
              disabled={isPlacingOrder || !isShippingSelected}
              className={styles.placeOrderButton}
            >
              {isPlacingOrder ? 'Processing...' : `Place Order`}
            </button>
          )
        )}
      </div>
    </div>
    </PayPalScriptProvider>
  );
}