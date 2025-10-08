'use client';

import React, { useRef } from 'react';
import styles from './PaymentMethods.module.css';
import ExpressCheckouts from './ExpressCheckouts';
// ★ নতুন PayPal এবং Stripe কম্পোনেন্ট ইম্পোর্ট করুন
import PayPalPaymentGateway from './PayPalPaymentGateway';
import StripePaymentGateway from './StripePaymentGateway'; 

interface PaymentGateway {
  id: string;
  title: string;
  description: string;
}
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
export default function PaymentMethods(props: PaymentMethodsProps) {
  const { gateways, selectedPaymentMethod, onPaymentMethodChange, total, onPlaceOrder, isPlacingOrder, isShippingSelected } = props;
  const stripeFormRef = useRef<HTMLFormElement>(null);

  const getGatewayIcon = (id: string): string => {
    if (id.includes('paypal') || id.includes('ppcp')) return 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png';
    return '';
  };

  const handlePlaceOrderClick = () => {
    if (selectedPaymentMethod.includes('stripe') && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
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
                    return <StripePaymentGateway 
                              ref={stripeFormRef} 
                              total={total} 
                              onPlaceOrder={onPlaceOrder} 
                              isPlacingOrder={isPlacingOrder} 
                           />;
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
            <PayPalPaymentGateway 
              total={total}
              isPlacingOrder={isPlacingOrder}
              onPlaceOrder={onPlaceOrder}
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