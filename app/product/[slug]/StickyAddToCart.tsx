// app/product/[slug]/StickyAddToCart.tsx

'use client';

import Image from 'next/image';
import styles from './StickyAddToCart.module.css';
import StickyActions from './StickyActions'; // <-- সমাধান: নতুন কম্পোনেন্ট ইম্পোর্ট করা হলো

// Product টাইপের জন্য একটি বেসিক interface
interface ProductForCart {
  id: string;
  databaseId: number;
  name: string;
  price?: string | null;
  image?: string | null;
  slug: string;
}

const StickyAddToCart = ({ product, isVisible }: { product: ProductForCart, isVisible: boolean }) => {
  return (
    <div className={`${styles.stickyWrapper} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.productInfo}>
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            width={50}
            height={50}
            className={styles.productImage}
          />
        )}
        <span className={styles.productName}>{product.name}</span>
      </div>
      <div className={styles.actions}>
        {/* --- সমাধান: এখানে নতুন StickyActions কম্পোনেন্ট ব্যবহার করা হচ্ছে --- */}
        <StickyActions product={product} /> 
      </div>
    </div>
  );
};

export default StickyAddToCart;