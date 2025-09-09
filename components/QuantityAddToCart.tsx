'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import styles from '../app/product/[slug]/ProductPage.module.css'; // আপনার CSS এর সঠিক পাথ

// --- Interfaces ---
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

  const handleAddToCart = async () => {
    if (!product || !product.databaseId) {
        console.error("Incomplete product data in QuantityAddToCart:", product);
        return;
    }

    await addToCart(
      {
        id: product.id,
        databaseId: product.databaseId,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      quantity
    );
  };

  return (
    <div className={styles.quantityAndCart}>
      <div className={styles.quantitySelector}>
        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={loading}>-</button>
        <span>{quantity}</span>
        <button onClick={() => setQuantity(q => q + 1)} disabled={loading}>+</button>
      </div>
      <button 
        onClick={handleAddToCart} 
        disabled={loading}
        className={styles.addToCartButton} // নিশ্চিত করুন এই ক্লাসটি আপনার CSS ফাইলে আছে
      >
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}