"use client";

import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, loading } = useCart();

  const parsePrice = (priceHtml: string): number => {
    if (!priceHtml) return 0;
    const priceString = String(priceHtml).replace(/<[^>]*>/g, '').replace(/[^0-9.]/g, '');
    return parseFloat(priceString) || 0;
  };

  const subtotal = cartItems.reduce((total, item) => {
    return total + parsePrice(item.price) * item.quantity;
  }, 0);
  
  // --- মূল সমাধান: ডাইনামিক চেকআউট URL তৈরি করার ফাংশন ---
  const generateCheckoutUrl = () => {
    if (cartItems.length === 0) return '#';
    
    const itemsForUrl = cartItems.map(item => ({
      id: item.databaseId,
      quantity: item.quantity
    }));
    
    const cartJson = JSON.stringify(itemsForUrl);
    const encodedCart = encodeURIComponent(cartJson);
    
    return `https://sharifulbuilds.com/cart/?cart_items=${encodedCart}`;
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your Cart is Empty</h1>
        <Link href="/products" className={styles.continueShopping}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Shopping Cart</h1>

      {loading && <div className={styles.loadingOverlay}>Updating Cart...</div>}
      
      <div className={`${styles.cartLayout} ${loading ? styles.disabled : ''}`}>
        <div className={styles.cartItems}>
          {cartItems.map(item => (
            <div key={item.key} className={styles.cartItem}>
              {item.image ? ( <img src={item.image} alt={item.name} className={styles.itemImage} /> ) : ( <div className={styles.placeholderImage} /> )}
              <div className={styles.itemInfo}>
                <h2 className={styles.itemName}>{item.name}</h2>
                <div className={styles.itemMeta}>
                    <p className={styles.itemPrice} dangerouslySetInnerHTML={{ __html: item.price }}></p>
                    <div className={styles.quantityControl}>
                      <button onClick={() => updateQuantity(item.key, item.quantity - 1)} disabled={loading || item.quantity <= 1}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.key, item.quantity + 1)} disabled={loading}>+</button>
                    </div>
                </div>
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => removeFromCart(item.key)} className={styles.removeButton} disabled={loading}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.cartSummary}>
          <h2>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {/* --- মূল সমাধান: a ট্যাগ এখন ডাইনামিক URL ব্যবহার করছে --- */}
          <a
            href={generateCheckoutUrl()}
            className={styles.checkoutButton}
          >
            Proceed to Checkout
          </a>
        </div>
      </div>
    </div>
  );
}