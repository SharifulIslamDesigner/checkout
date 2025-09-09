'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './products.module.css';
import { useCart } from '../../context/CartContext';

// --- Interface ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
}
interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product || !product.databaseId) {
      console.error("Incomplete product data in ProductCard:", product);
      return;
    }

    setIsAdding(true);
    
    try {
      await addToCart(
        {
          id: product.id,
          databaseId: product.databaseId,
          name: product.name,
          price: product.price,
          image: product.image?.sourceUrl,
        },
        1 // পরিমাণ ১
      );
    } catch (error) {
      console.error("Error adding item from ProductCard", error);
    } finally {
      setIsAdding(false);
    }
  };

  const canDisplayPrice = product.price && typeof product.price === 'string';

  return (
    <Link href={`/product/${product.slug}`} className={styles.productCard}>
        <div className={styles.productImageContainer}>
            {product.image?.sourceUrl ? ( 
              <img src={product.image.sourceUrl} alt={product.name} className={styles.productImage} /> 
            ) : ( 
              <div className={styles.placeholderImage} /> 
            )}
        </div>
        <div className={styles.productInfo}>
            <h2 className={styles.productName}>{product.name}</h2>
            <div className={styles.productRating}>★★★★☆ <span className={styles.ratingCount}>(4.5)</span></div>
            
            {canDisplayPrice ? (
              <div className={styles.productPrice} dangerouslySetInnerHTML={{ __html: product.price! }} />
            ) : (
              <div className={styles.productPrice}>Price not available</div>
            )}

            <button 
              className={styles.addToCartBtn} 
              onClick={handleAddToCart}
              disabled={isAdding} 
            >
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
        </div>
    </Link>
  );
}