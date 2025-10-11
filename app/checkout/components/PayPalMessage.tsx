//app/checkout/components/PaypalMessage.tsx

'use client';
import React from 'react';
import { PayPalMessages } from '@paypal/react-paypal-js';
import styles from './PaymentMethods.module.css';

interface PayPalMessageProps {
  total: number;
}
export default function PayPalMessage({ total }: PayPalMessageProps) {
  if (total <= 0) return null;
  return (
    <div className={styles.paypalMessageContainer}>
      <PayPalMessages forceReRender={[{ amount: total }]} />
    </div>
  );
}