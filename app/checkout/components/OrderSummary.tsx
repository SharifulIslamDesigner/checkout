// app/checkout/components/OrderSummary.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './OrderSummary.module.css'; // একটি সম্মিলিত CSS ফাইল ব্যবহার করা হবে

// --- TypeScript Interfaces ---
interface CartItem {
  key: string;
  name: string;
  quantity: number;
  price: string;
  image?: string;
}

interface AppliedCoupon {
  code: string;
  discountAmount?: string;
}

interface CartData {
  subtotal: string | null;
  total: string | null;
  discountTotal: string | null;
  appliedCoupons: AppliedCoupon[] | null;
}

interface ShippingRate {
  id: string;
  label: string;
  cost: string;
}

// --- নতুন Props Interface (সবকিছু একত্রিত) ---
interface YourOrderProps {
  // OrderSummary থেকে আসা Props
  cartItems: CartItem[];
  cartData: CartData | null;
  onRemoveCoupon: (couponCode: string) => Promise<void>;
  isRemovingCoupon: boolean;
  
  // CouponForm থেকে আসা Props
  onApplyCoupon: (couponCode: string) => Promise<void>;
  isApplyingCoupon: boolean;
  
  // ShippingOptions থেকে আসা Props
  rates: ShippingRate[];
  selectedRateId: string;
  onRateSelect: (rateId: string) => void;
  isLoadingShipping: boolean;
  addressEntered: boolean;
}

export default function OrderSummary({
  cartItems,
  cartData,
  onRemoveCoupon,
  isRemovingCoupon,
  onApplyCoupon,
  isApplyingCoupon,
  rates,
  selectedRateId,
  onRateSelect,
  isLoadingShipping,
  addressEntered,
}: YourOrderProps) {

  // --- CouponForm-এর State এবং Logic ---
  const [couponCode, setCouponCode] = useState('');
  const handleApplyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (couponCode.trim()) {
      onApplyCoupon(couponCode.trim());
    }
  };

  // --- OrderSummary-এর Logic ---
  const subtotalDisplay = cartData?.subtotal || '$0.00';
  const totalDisplay = cartData?.total || '$0.00';

  return (
    // ★★★ এই ক্লাস নামটি পরিবর্তন করা যেতে পারে আপনার CSS অনুযায়ী ★★★
    <div className={styles.yourOrderContainer}> 
      <h2 className={styles.title}>Your Order</h2>

      {/* --- Product List (from OrderSummary.tsx) --- */}
      <div className={styles.itemsList}>
        {cartItems.map(item => (
          <div key={item.key} className={styles.summaryItem}>
             <div className={styles.itemImageWrapper}>
              {item.image ? (
                <Image src={item.image} alt={item.name} width={64} height={64} className={styles.itemImage} />
              ) : (
                <div className={styles.placeholderImage} />
              )}
              <span className={styles.itemQuantity}>{item.quantity}</span>
            </div>
            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name}</p>
            </div>
            <p className={styles.itemPrice} dangerouslySetInnerHTML={{ __html: item.price }} />
          </div>
        ))}
      </div>

      {/* --- Coupon Form (from CouponForm.tsx) --- */}
      <div className={styles.couponContainer}>
        <h3 className={styles.couponTitle}>Have a Coupon Code?</h3>
        <div className={styles.couponForm}>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code"
            className={styles.couponInput}
            disabled={isApplyingCoupon}
          />
          <button
            onClick={handleApplyClick}
            className={styles.couponButton}
            disabled={isApplyingCoupon || !couponCode.trim()}
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>
      
      {/* --- Price Summary & Shipping Options --- */}
      <div className={styles.totalsSection}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span dangerouslySetInnerHTML={{ __html: subtotalDisplay }} />
        </div>

        {cartData?.appliedCoupons?.map(coupon => (
          <div key={coupon.code} className={`${styles.totalRow} ${styles.couponRow}`}>
            <span>Coupon: {coupon.code}</span>
            <div className={styles.couponValue}>
              <span dangerouslySetInnerHTML={{ __html: `-${cartData.discountTotal || '$0.00'}` }} />
              <button
                onClick={() => onRemoveCoupon(coupon.code)}
                className={styles.removeButton}
                disabled={isRemovingCoupon}
              >
                {isRemovingCoupon ? "[Removing...]" : "[Remove]"}
              </button>
            </div>
          </div>
        ))}

        {/* --- Shipping Options (from ShippingOptions.tsx) --- */}
        <div className={styles.shippingSectionInSummary}>
          <div className={`${styles.totalRow} ${styles.shippingTitleRow}`}>
            <span>Shipping</span>
          </div>
          <div className={styles.shippingOptionsContainer}>
            {isLoadingShipping ? (
              <div className={styles.loadingContainer}><span>Calculating shipping...</span></div>
            ) : rates.length > 0 ? (
              rates.map((rate) => (
                <div
                  key={rate.id}
                  className={`${styles.shippingOption} ${selectedRateId === rate.id ? styles.selected : ''}`}
                  onClick={() => onRateSelect(rate.id)}
                >
                  <label htmlFor={rate.id} className={styles.rateLabel}>
                    <input type="radio" id={rate.id} name="shipping_method" value={rate.id} checked={selectedRateId === rate.id} readOnly className={styles.radioInput} />
                    <span className={styles.labelText}>{rate.label}</span>
                    <strong className={styles.rateCost}>${parseFloat(rate.cost).toFixed(2)}</strong>
                  </label>
                </div>
              ))
            ) : (
              <div className={styles.infoMessageContainer}>
                <p className={styles.infoMessage}>
                  {addressEntered ? 'No shipping options found for your address.' : 'Enter your address to view shipping options.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
          <span>Total</span>
          <span dangerouslySetInnerHTML={{ __html: totalDisplay }} />
        </div>
      </div>
    </div>
  );
}