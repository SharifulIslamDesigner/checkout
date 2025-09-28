// app/product/[slug]/StickyActions.tsx

'use client';

import { useState } from 'react';
import { useCart } from '../../../context/CartContext'; // CartContext থেকে ফাংশন ইম্পোর্ট করুন
import styles from './StickyActions.module.css'; // এই কম্পোনেন্টের নিজস্ব CSS

// Product টাইপের জন্য interface
interface ProductForCart {
  id: string;
  databaseId: number;
  name: string;
  price?: string | null;
  image?: string | null;
  slug: string;
}

interface StickyActionsProps {
  product: ProductForCart;
}

export default function StickyActions({ product }: StickyActionsProps) {
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
    <div className={styles.actionsWrapper}>
      <div className={styles.quantitySelector}>
        <button 
          onClick={() => handleQuantityChange(-1)} 
          disabled={isCartLoading || isAdding || quantity <= 1}
        >
          -
        </button>
        <span>{quantity}</span>
        <button 
          onClick={() => handleQuantityChange(1)} 
          disabled={isCartLoading || isAdding}
        >
          +
        </button>
      </div>
      
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