'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import styles from './QuantityAddToCart.module.css';

// ... (ProductForCart ইন্টারফেস অপরিবর্তিত)

export default function QuantityAddToCart({ product }: { product: ProductForCart }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, loading: isCartLoading } = useCart(); // <-- গ্লোবাল লোডিং-এর নাম পরিবর্তন করা হয়েছে
  
  // --- কার্যকরী সমাধান: একটি লোকাল লোডিং স্টেট তৈরি করা ---
  const [isAdding, setIsAdding] = useState(false);
  // ----------------------------------------------------

  const handleAddToCart = async () => {
    setIsAdding(true); // <-- শুধুমাত্র লোকাল স্টেট পরিবর্তন করুন
    await addToCart(product, quantity);
    setIsAdding(false); // <-- শুধুমাত্র লোকাল স্টেট পরিবর্তন করুন
  };

  return (
    <div className={styles.quantityAndCartWrapper}>
      <div className={styles.quantitySelector}>
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          disabled={isAdding || isCartLoading} // <-- দুটি লোডিং অবস্থাই চেক করুন
        >
          -
        </button>
        <span>{quantity}</span>
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          disabled={isAdding || isCartLoading}
        >
          +
        </button>
      </div>
      <button 
        className={styles.addToCartButton}
        onClick={handleAddToCart}
        disabled={isAdding || isCartLoading} // <-- দুটি লোডিং অবস্থাই চেক করুন
      >
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}