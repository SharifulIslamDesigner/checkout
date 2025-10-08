'use client';

import React from 'react';
import styles from './PaymentMethods.module.css';

export default function OfflinePayment({ gateway, onPlaceOrder, isPlacingOrder, isShippingSelected }: any) {
  return (
    <div className={styles.offlinePayment}>
      <p dangerouslySetInnerHTML={{ __html: gateway?.description || '' }} />
      <button
        onClick={() => onPlaceOrder()}
        disabled={isPlacingOrder || !isShippingSelected}
        className={styles.placeOrderButton}
      >
        {isPlacingOrder ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
}