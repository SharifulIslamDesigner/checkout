'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import styles from './MiniCart.module.css';
import { IoClose } from 'react-icons/io5';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cartItems, removeFromCart, updateQuantity, loading } = useCart();

  useEffect(() => {
    if (isOpen) { document.body.classList.add('no-scroll'); } 
    else { document.body.classList.remove('no-scroll'); }
    return () => { document.body.classList.remove('no-scroll'); };
  }, [isOpen]);

  const parsePrice = (price: string) => {
    const cleanedPrice = price ? String(price).replace(/<[^>]*>|[^0-9.]/g, '') : '0';
    return parseFloat(cleanedPrice) || 0;
  };

  const subtotal = cartItems.reduce((total, item) => {
    const price = parsePrice(item.price);
    return total + price * item.quantity;
  }, 0);

  // --- মূল সমাধান: ডাইনামিক চেকআউট URL তৈরি করার ফাংশন ---
  const generateCheckoutUrl = () => {
    if (cartItems.length === 0) return '#';
    
    // কার্ট আইটেমগুলোকে শুধুমাত্র id এবং quantity সহ একটি নতুন অ্যারেতে পরিণত করা হচ্ছে
    const itemsForUrl = cartItems.map(item => ({
      id: item.databaseId,
      quantity: item.quantity
    }));
    
    // অ্যারেটিকে JSON স্ট্রিং-এ পরিণত করা হচ্ছে
    const cartJson = JSON.stringify(itemsForUrl);
    
    // URL-এর জন্য স্ট্রিংটিকে এনকোড করা হচ্ছে
    const encodedCart = encodeURIComponent(cartJson);
    
    // চূড়ান্ত URL তৈরি করা হচ্ছে
    return `https://sharifulbuilds.com/cart/?cart_items=${encodedCart}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`${styles.miniCartOverlay} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>
      <div className={`${styles.miniCartContainer} ${isOpen ? styles.open : ''}`}>
        <header className={styles.header}>
          <h3>Shopping Cart</h3>
          <button className={styles.closeButton} onClick={onClose}><IoClose /></button>
        </header>

        {loading && <div className={styles.loadingBar}>Processing...</div>}

        <div className={styles.cartBody}>
          {cartItems.length === 0 ? (
            <p className={styles.emptyMessage}>Your cart is empty.</p>
          ) : (
            cartItems.map(item => (
              <div key={item.key} className={styles.cartItem}>
                {item.image ? (<img src={item.image} alt={item.name} className={styles.itemImage} />) : (<div className={styles.placeholderImage}/>)}
                <div className={styles.itemDetails}>
                  <p className={styles.itemName}>{item.name}</p>
                  <div className={styles.quantityControl}>
                    <span>Qty: </span>
                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} disabled={loading || item.quantity <= 1}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} disabled={loading}>+</button>
                  </div>
                  <p className={styles.itemPrice} dangerouslySetInnerHTML={{ __html: item.price }}></p>
                </div>
                <div className={styles.itemActions}>
                    <button className={styles.removeButton} onClick={() => removeFromCart(item.key)} disabled={loading}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className={styles.footer}>
            <div className={styles.subtotal}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.actionButtons}>
              <Link href="/cart" className={`${styles.actionButton} ${styles.viewCart}`} onClick={onClose}>
                View Cart
              </Link>
              {/* --- মূল সমাধান: a ট্যাগ এখন ডাইনামিক URL ব্যবহার করছে --- */}
              <a 
                href={generateCheckoutUrl()}
                className={`${styles.actionButton} ${styles.checkout}`}
                onClick={onClose}
              >
                Checkout
              </a>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}