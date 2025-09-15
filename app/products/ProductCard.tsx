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
  onSale: boolean;
  regularPrice?: string;
  salePrice?: string;
  averageRating?: number;
  reviewCount?: number;
}
interface ProductCardProps {
  product: Product;
}

// --- কার্যকরী সমাধান: StarRating কম্পוננטটিকে ইন্টারফেসের বাইরে আনা হয়েছে ---
const StarRating = ({ rating, count }: { rating: number, count: number }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={styles.starRating}>
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
      {halfStar && <span key="half">⭐</span>}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
      
      {/* --- কার্যকরী সমাধান: এখানে "customer review(s)" যোগ করা হয়েছে --- */}
      {count > 0 && (
        <span className={styles.ratingValue}>
          ({rating.toFixed(1)}) ({count} customer review{count > 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};
// --------------------------------------------------------------------------

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const parsePrice = (priceStr?: string): number => {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  };

  const regularPriceNum = parsePrice(product.regularPrice);
  const salePriceNum = parsePrice(product.salePrice);
  const discountPercent = regularPriceNum > 0 && salePriceNum < regularPriceNum 
      ? Math.round(((regularPriceNum - salePriceNum) / salePriceNum) * 100) 
      : 0;

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
          // price এবং image এখন আর addToCart-এ পাঠানো হচ্ছে না, কারণ Context এটি হ্যান্ডেল করতে পারে
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
          {product.onSale && discountPercent > 0 && (
                <div className={styles.discountBadge}>-{discountPercent}%</div>
            )}
            {product.image?.sourceUrl ? ( 
              <img src={product.image.sourceUrl} alt={product.name} className={styles.productImage} /> 
            ) : ( 
              <div className={styles.placeholderImage} /> 
            )}
        </div>
        <div className={styles.productInfo}>
             <h3 className={styles.productName}>{product.name}</h3>
          
          {/* --- কার্যকরী সমাধান: শর্তটিকে সরল করা হয়েছে --- */}
          {typeof product.averageRating === 'number' ? (
            <StarRating rating={product.averageRating} count={product.reviewCount || 0} />
          ) : (
            // যদি averageRating না থাকে, তাহলে একটি ফলব্যাক দেখানো যেতে পারে
            <div className={styles.noRating}><StarRating rating={0} count={0} /></div>
          )}
            
            <div className={styles.priceContainer}>
                {product.onSale && product.salePrice ? (
                    <>
                        <span className={styles.regularPriceStriked} dangerouslySetInnerHTML={{ __html: product.regularPrice || '' }} />
                        <span className={styles.salePrice} dangerouslySetInnerHTML={{ __html: product.salePrice }} />
                    </>
                ) : (
                    <div className={styles.productPrice} dangerouslySetInnerHTML={{ __html: product.price || 'Price not available' }} />
                )}
            </div>
            {/* -------------------------------------------- */}

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