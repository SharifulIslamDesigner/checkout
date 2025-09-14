'use client';

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient';
import Link from 'next/link';
import Image from 'next/image';
import styles from './FeaturedBikes.module.css';
import { useCart } from '../context/CartContext';

// --- টাইপ ইন্টারফেস ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
  averageRating?: number;
  reviewCount?: number;
}

// --- GraphQL কোয়েরি ---
const GET_FEATURED_BIKES_QUERY = gql`
  query GetFeaturedBikes {
    products(where: { category: "bikes" }, first: 3) {
      nodes {
        id
        databaseId
        name
        slug
        image { sourceUrl }
        ... on SimpleProduct { price(format: FORMATTED) }
        ... on VariableProduct { price(format: FORMATTED) }
        averageRating
        reviewCount
      }
    }
  }
`;

// --- স্টার রেটিং কম্পוננט ---
const StarRating = ({ rating, count }: { rating: number, count: number }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const emptyStars = totalStars - fullStars;
    
    // rating 0 হলে halfStar false হবে
    const halfStar = rating > 0 && rating % 1 !== 0;

    return (
        <div className={styles.featuredStarRating}>
            {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
            {halfStar && <span key="half">⭐</span>}
            {[...Array(emptyStars - (halfStar ? 1 : 0))].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
            
            {count > 0 && (
              <span className={styles.featuredReviewCount}>
                ({rating.toFixed(1)}) ({count})
              </span>
            )}
        </div>
    );
};

// --- Add to Cart বাটন ---
const AddToCartButton = ({ product }: { product: Product }) => {
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setIsAdding(true);
        await addToCart({
            id: product.id,
            databaseId: product.databaseId,
            name: product.name,
        }, 1);
        setIsAdding(false);
    };

    return (
        <button onClick={handleAddToCart} className={styles.featuredAddToCartBtn} disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add to cart'}
        </button>
    );
}


// --- মূল কম্পোনেন্ট ---
export default function FeaturedBikes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getFeaturedBikes() {
      try {
        const { data } = await client.query({
          query: GET_FEATURED_BIKES_QUERY,
        });
        setProducts(data.products.nodes);
      } catch (error) {
        console.error("Error fetching featured bikes:", error);
      } finally {
        setLoading(false);
      }
    }
    getFeaturedBikes();
  }, []);

  if (loading) {
    return (
        <section className={styles.featuredBikesSection}>
            <div className={styles.container}>
                <p style={{ textAlign: 'center' }}>Loading Top Bikes...</p>
            </div>
        </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.featuredBikesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Explore Our Top Kids Electric Bikes</h2>
          <p className={styles.sectionSubtitle}>
            Discover our best-selling Kids electric bike, engineered for safety, performance, and endless fun. 
            Each GoBike is built to grow with your child, making it the perfect choice for young Aussie adventurers.
          </p>
        </div>
        <div className={styles.featuredGrid}>
          {products.map((product) => (
            <div key={product.id} className={styles.featuredProductCard}>
              <Link href={`/product/${product.slug}`}>
                <div className={styles.featuredImageWrapper}>
                  {product.image?.sourceUrl && (
                    <Image
                      src={product.image.sourceUrl}
                      alt={product.name}
                      width={500}
                      height={500}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div className={styles.featuredCardContent}>
                  <h3 className={styles.featuredProductName}>{product.name}</h3>
                  
                  {/* --- কার্যকরী সমাধান: ProductCard-এর মতোই একই শর্ত এবং prop পাসিং --- */}
                  {typeof product.averageRating === 'number' ? (
                    <StarRating rating={product.averageRating} count={product.reviewCount || 0} />
                  ) : (
                    // ফলব্যাক হিসেবে খালি স্টার দেখানো হচ্ছে
                    <div className={styles.featuredStarRating}>
                        {[...Array(5)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
                    </div>
                  )}
                  {/* ------------------------------------------------------------------------- */}

                  <div className={styles.featuredProductPrice} dangerouslySetInnerHTML={{ __html: product.price || '' }} />
                </div>
              </Link>
              <AddToCartButton product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}