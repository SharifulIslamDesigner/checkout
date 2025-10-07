"use client";
import Breadcrumbs from '../../components/Breadcrumbs';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import styles from './CartPage.module.css';
import CartCrossSell from '../../components/CartCrossSell';
import { gtmViewCart, gtmBeginCheckout } from '../../lib/gtm';
import { useEffect } from 'react'; // <-- useEffect ইম্পোর্ট করা হয়েছে
import Image from 'next/image';

// --- কার্যকরী সমাধান: একটি নতুন ক্লায়েন্ট কম্পוננט তৈরি করা হয়েছে ---
function CheckoutButton() {
    const { cartItems } = useCart();

    const handleCheckout = () => {
        if (cartItems.length > 0) {
            const gtmItems = cartItems.map(item => {
                const priceNum = parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0');
                return {
                    item_name: item.name,
                    item_id: item.databaseId,
                    price: priceNum,
                    quantity: item.quantity,
                };
            });
            gtmBeginCheckout(gtmItems);
        }
    };

    return (
        // এখানে a ট্যাগের পরিবর্তে Next.js-এর Link কম্পোনেন্ট ব্যবহার করা হয়েছে
        <Link 
            href="/checkout" // <-- নতুন চেকআউট পেজের লিঙ্ক
            className={styles.checkoutButton}
            onClick={handleCheckout}
        >
            Proceed to Checkout
        </Link>
    );
}
// -----------------------------------------------------------


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
  
  // --- view_cart ইভেন্ট পাঠানোর জন্য useEffect ---
  useEffect(() => {
    if (cartItems.length > 0) {
        const gtmItems = cartItems.map(item => {
            const priceNum = parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0');
            return {
                item_name: item.name,
                item_id: item.databaseId,
                price: priceNum,
                quantity: item.quantity,
            };
        });
        gtmViewCart(gtmItems);
    }
  }, [cartItems]);
  // ---------------------------------------------

  return (
    <>
      <Breadcrumbs pageTitle="Shopping Cart" />
    <div className={styles.container}>
      {cartItems.length === 0 && !loading ? (
        <div className={styles.emptyCartContainer}>
          <h1 className={styles.title}>Your Cart is Empty</h1>
          <Link href="/products" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <h1 className={styles.title}>Your Shopping Cart</h1>

          {loading && <div className={styles.loadingOverlay}>Updating Cart...</div>}
          
          <div className={`${styles.cartLayout} ${loading ? styles.disabled : ''}`}>
            <div className={styles.cartItems}>
              {cartItems.map(item => (
                <div key={item.key} className={styles.cartItem}>
                  {item.image ? ( <Image src={item.image} alt={item.name} className={styles.itemImage} width={100} height={100}/> ) : ( <div className={styles.placeholderImage} /> )}
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
              
              {/* --- কার্যকরী সমাধান: নতুন CheckoutButton কম্পוננטটি এখানে ব্যবহার করা হয়েছে --- */}
              <CheckoutButton />
              {/* ---------------------------------------------------------------------- */}
            </div>
          </div>
        </>
      )}

      <CartCrossSell />
    </div>
    </>
  );
}