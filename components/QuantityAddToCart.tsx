'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import styles from './QuantityAddToCart.module.css'; // <-- নতুন CSS ফাইল ইম্পোর্ট করুন

interface ProductForCart {
  id: string;
  databaseId: number;
  name: string;
  price?: string;
  image?: string;
}

export default function QuantityAddToCart({ product }: { product: ProductForCart }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, loading } = useCart();

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <div className={styles.quantityAndCartWrapper}>
      <div className={styles.quantitySelector}>
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          disabled={loading}
        >
          -
        </button>
        <span>{quantity}</span>
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          disabled={loading}
        >
          +
        </button>
      </div>
      <button 
        className={styles.addToCartButton}
        onClick={handleAddToCart}
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}