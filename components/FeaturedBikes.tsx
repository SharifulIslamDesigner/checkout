'use client';

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient'; // ক্লায়েন্ট কম্পোনেন্টের জন্য এটিই সঠিক
import Link from 'next/link';
import Image from 'next/image';
import styles from './FeaturedBikes.module.css';
import { useCart } from '../context/CartContext';

// --- টাইপ ইন্টারফেস (সম্পূর্ণ এবং সঠিক) ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string } | null;
  price?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  onSale: boolean;
  regularPrice?: string | null;
  salePrice?: string | null;
}

interface QueryData {
  products: {
    nodes: Product[];
  } | null;
}

// --- GraphQL কোয়েরি (অপরিবর্তিত) ---
const GET_FEATURED_BIKES_QUERY = gql`
  query GetFeaturedBikes {
    products(where: { category: "bikes" }, first: 3) {
      nodes {
        id
        databaseId
        name
        slug
        image { sourceUrl }
        averageRating
        reviewCount
        onSale
        ... on SimpleProduct { 
          price(format: FORMATTED)
          regularPrice(format: FORMATTED)
          salePrice(format: FORMATTED)
        }
        ... on VariableProduct { 
          price(format: FORMATTED)
          regularPrice(format: FORMATTED)
          salePrice(format: FORMATTED)
        }
      }
    }
  }
`;

// --- স্টার রেটিং কম্পוננט ---
const StarRating = ({ rating, count }: { rating: number, count: number }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <div className={styles.featuredStarRating}>
            {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
            {halfStar && <span key="half">⭐</span>}
            {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
            
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
        try {
            // --- সমাধান: addToCart-কে এখন সম্পূর্ণ ডেটা পাঠানো হচ্ছে ---
            await addToCart({
                id: product.id,
                databaseId: product.databaseId,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.image?.sourceUrl
            }, 1);
        } catch (error) {
            console.error("Error from AddToCartButton:", error);
        } finally {
            setIsAdding(false);
        }
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
        const { data } = await client.query<QueryData>({
          query: GET_FEATURED_BIKES_QUERY,
        });
        
        if (data?.products?.nodes) {
            setProducts(data.products.nodes);
        }
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
          {products.map((product) => {
            const parsePrice = (priceStr?: string | null): number => {
                if (!priceStr) return 0;
                return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
            };
            const regularPriceNum = parsePrice(product.regularPrice);
            const salePriceNum = parsePrice(product.salePrice);
            const discountPercent = regularPriceNum > 0 && salePriceNum > 0 && salePriceNum < regularPriceNum 
                ? Math.round(((regularPriceNum - salePriceNum) / regularPriceNum) * 100)
                : 0;
            
            return (
                <div key={product.id} className={styles.featuredProductCard}>
                  <Link href={`/product/${product.slug}`}>
                    <div className={styles.featuredImageWrapper}>
                      {product.onSale && discountPercent > 0 && (
                          <div className={styles.featuredDiscountBadge}>-{discountPercent}%</div>
                      )}
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
                      
                      {typeof product.averageRating === 'number' ? (
                        <StarRating rating={product.averageRating} count={product.reviewCount || 0} />
                      ) : (
                        <div className={styles.featuredStarRating}>
                            {[...Array(5)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
                        </div>
                      )}

                      <div className={styles.featuredPriceContainer}>
                          {product.onSale && product.salePrice ? (
                              <>
                                  <span className={styles.featuredRegularPriceStriked} dangerouslySetInnerHTML={{ __html: product.regularPrice || '' }} />
                                  <span className={styles.featuredSalePrice} dangerouslySetInnerHTML={{ __html: product.salePrice }} />
                              </>
                          ) : (
                              <div className={styles.featuredProductPrice} dangerouslySetInnerHTML={{ __html: product.price || '' }} />
                          )}
                      </div>
                    </div>
                  </Link>
                  <AddToCartButton product={product} />
                </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}