'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import styles from './QuantityAddToCart.module.css';
import toast from 'react-hot-toast';

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
  const { addToCart, loading: isCartLoading, closeMiniCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await addToCart(product, quantity);
      closeMiniCart();
      toast.dismiss();
      router.push('/checkout');
    } catch (error) {
      console.error("Failed to process 'Buy Now':", error);
      toast.dismiss();
      toast.error('Could not process order.');
      setIsBuying(false);
    }
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const isLoading = isCartLoading || isAdding || isBuying;

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.quantityAndCartWrapper}>
        <div className={styles.quantitySelector}>
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={isLoading || quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={isLoading}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          className={styles.addToCartButton}
          onClick={handleAddToCart}
          disabled={isLoading}
        >
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>

      <button
        className={styles.buyNowButton}
        onClick={handleBuyNow}
        disabled={isLoading}
      >
        {isBuying ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}