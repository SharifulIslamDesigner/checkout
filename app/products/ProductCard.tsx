'use client';
import Image from 'next/image';
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
  averageRating?: number;
  reviewCount?: number;
  onSale: boolean;
  regularPrice?: string;
  salePrice?: string;
}
interface ProductCardProps {
  product: Product;
}
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
  
  // --- কার্যকরী সমাধান: ডিসকাউন্ট শতাংশ গণনা ---
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
    'use client';
    e.preventDefault();
    e.stopPropagation();

    if (!product || !product.databaseId) {
      console.error("Incomplete product data in ProductCard:", product);
      return;
    }

    setIsAdding(true);
    
    try {
        await addToCart({
            id: product.id,
            databaseId: product.databaseId,
            name: product.name,
            price: product.price,
            image: product.image?.sourceUrl,
            slug: product.slug,
        }, 1);
    } catch (error) {
        console.error("Error adding item from ProductCard", error);
    } finally {
        setIsAdding(false);
    }
  };

  return (
    // --- কার্যকরী সমাধান: মূল কন্টেইনার এখন একটি div, Link নয় ---
    <div className={styles.productCard}>
        <Link href={`/product/${product.slug}`} className={styles.productLinkWrapper}>
            <div className={styles.productImageContainer}>
                {product.onSale && discountPercent > 0 && (
                    <div className={styles.discountBadge}>-{discountPercent}%</div>
                )}
                {product.image?.sourceUrl ? ( 
                  <Image src={product.image.sourceUrl} width={1000} height={1000} alt={product.name} className={styles.productImage} /> 
                ) : ( 
                  <div className={styles.placeholderImage} /> 
                )}
            </div>
            <div className={styles.productInfo}>
                 <h3 className={styles.productName}>{product.name}</h3>

                {typeof product.averageRating === 'number' ? (
                    <StarRating rating={product.averageRating} count={product.reviewCount || 0} />
                ) : (
                    <div className={styles.noRating}></div>
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
            </div>
        </Link>
        
        {/* --- কার্যকরী সমাধান: বাটনটিকে Link-এর বাইরে আনা হয়েছে --- */}
        <button 
          className={styles.addToCartBtn} 
          onClick={handleAddToCart}
          disabled={isAdding} 
        >
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
        {/* ----------------------------------------------------------- */}
    </div>
  );
}