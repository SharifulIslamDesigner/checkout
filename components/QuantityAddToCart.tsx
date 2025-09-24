'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import styles from './QuantityAddToCart.module.css';

// --- ProductForCart interface ---
interface ProductForCart {
    id: string;
    databaseId: number;
    name: string;
    price?: string | null;
    image?: string | null;
    slug: string;
}

export default function QuantityAddToCart({ product }: { product: ProductForCart }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, loading: isCartLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  return (
    // --- সমাধান: JSX স্ট্রাকচারটি আপনার CSS-এর সাথে মেলানো হয়েছে ---
    <div className={styles.quantityAndCartWrapper}>
        
        {/* --- পরিমাণ (+/-) অংশ --- */}
        <div className={styles.quantitySelector}>
            <button 
                onClick={() => handleQuantityChange(-1)} 
                disabled={isCartLoading || isAdding || quantity <= 1}
                aria-label="Decrease quantity"
            >
                -
            </button>
            <span>{quantity}</span>
            <button 
                onClick={() => handleQuantityChange(1)} 
                disabled={isCartLoading || isAdding}
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
        
        {/* --- মূল "Add to Cart" বাটন --- */}
        <button 
            className={styles.addToCartButton}
            onClick={handleAddToCart}
            disabled={isCartLoading || isAdding}
        >
            {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>

    </div>
  );
}