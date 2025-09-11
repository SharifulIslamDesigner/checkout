'use client';

import { useState } from 'react';
import styles from './ProductPage.module.css';
import Image from 'next/image';
import QuantityAddToCart from '../../../components/QuantityAddToCart';
import ReviewForm from './ReviewForm';
import ProductCard from '../../products/ProductCard';

interface ImageNode { sourceUrl: string; }
interface Attribute { name: string; options: string[]; }
interface Review { id: string; author: { node: { name: string; avatar?: { url: string } }; }; content: string; date: string; rating: number; }
interface RelatedProduct { id: string; databaseId: number; name: string; slug: string; image?: ImageNode; price?: string; }
interface Product {
  id: string;
  databaseId: number;
  name: string;
  description: string;
  shortDescription?: string;
  image?: ImageNode;
  galleryImages: { nodes: ImageNode[]; };
  price?: string;
  attributes: { nodes: Attribute[]; };
  reviews: { 
      nodes: Review[];
      reviewCount: number;
      averageRating: number;
    };
  related: { nodes: RelatedProduct[]; };
}
const StarRating = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    const fullStars = Math.round(rating || 0);
    const emptyStars = totalStars - fullStars;
    return (
        <div className={styles.starRating}>
            {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`}>★</span>)}
            {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
        </div>
    );
};
export default function ProductClient({ product }: { product: Product }) {
    const [mainImage, setMainImage] = useState<string | undefined>(product.image?.sourceUrl);

    if (!product) return null;

    const productForCart = {
        id: product.id,
        databaseId: product.databaseId,
        name: product.name,
        price: product.price,
        image: product.image?.sourceUrl,
    };

    const allImages = [product.image, ...product.galleryImages.nodes].filter(Boolean) as ImageNode[];
    const customerImages = product.reviews?.nodes
        ?.map((review: Review) => review.author.node.avatar?.url)
        .filter(Boolean) || [];
        
    return (
        <div className={styles.container}>
        <div className={styles.productLayout}>
            <div className={styles.galleryContainer}>
                {mainImage && <img src={mainImage} alt={product.name} className={styles.mainImage} />}
                {allImages.length > 1 && (
                    <div className={styles.thumbnailGrid}>
                    {allImages.map((img, index) => (
                        <img key={index} src={img.sourceUrl} alt={`${product.name} thumbnail ${index + 1}`}
                        className={`${styles.thumbnail} ${mainImage === img.sourceUrl ? styles.activeThumbnail : ''}`}
                        onClick={() => setMainImage(img.sourceUrl)} />
                    ))}
                    </div>
                )}
            </div>

            <div>
            <h1 className={styles.productTitle}>{product.name}</h1>
            <div className={styles.ratingWrapper}>
                <div className={styles.rating}>★★★★☆</div>
                {product.reviews && product.reviews.nodes.length > 0 ? (
                    <a href="#reviews" className={styles.reviewsCount}>({product.reviews.nodes.length} customer reviews)</a>
                ) : (
                    <div className={styles.reviewsCount}>(No reviews yet)</div>
                )}
            </div>
            <div className={styles.priceWrapper}>
                <img src="https://gobike.au/wp-content/uploads/2025/08/hot-deal.svg" alt="Hot Deal" className={styles.dealBadge} />
                {product.price && (
                <div className={styles.productPrice} dangerouslySetInnerHTML={{ __html: product.price }} />
                )}
            </div>
            {product.shortDescription && (
                <div 
                className={styles.shortDescription} 
                dangerouslySetInnerHTML={{ __html: product.shortDescription.replace(/<ul>/g, `<ul class="${styles.featuresGrid}">`).replace(/<li>/g, `<li class="${styles.featureItem}">`) }} 
                />
            )}
            <QuantityAddToCart product={productForCart} />
            <div className={styles.trustBadges}>
                <span>✓ 100% Secure Checkout</span>
                <span>✓ 30 Days Easy Returns</span>
                <span>✓ 1 Year Full Warranty</span>
                <span>✓ Fast Shipping Aus-Wide</span>
            </div>
            <div className={styles.checkoutGuarantee}>
                <p className={styles.guaranteeText}>Guaranteed Safe Checkout</p>
                <img src="https://themedemo.commercegurus.com/shoptimizer-demodata/wp-content/uploads/sites/53/2018/07/trust-symbols_a.jpg" alt="Payment Methods" className={styles.paymentLogos} />
            </div>
            </div>
        </div>
        
        {product.description && (
            <section className={styles.productInfoSection}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <div className={styles.sectionContent} dangerouslySetInnerHTML={{ __html: product.description }} />
            </section>
        )}

        {product.attributes && product.attributes.nodes.length > 0 && (
            <section className={styles.productInfoSection}>
            <h2 className={styles.sectionTitle}>Additional Information</h2>
            <div className={styles.sectionContent}>
                <table>
                <tbody>
                    {product.attributes.nodes.map((attr, index) => (
                    <tr key={index}>
                        <th>{attr.name}</th>
                        <td>{attr.options.join(', ')}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </section>
        )}
        
       <section id="reviews" className={styles.productInfoSection}>
                <div className={styles.reviewsGrid}>
                
                  <div className={styles.reviewsList}>
                    {customerImages.length > 0 && (
                        <div className={styles.customerImagesSection}>
                            <h3>Customer Images</h3>
                            <div className={styles.customerImagesGrid}>
                                {customerImages.map((imageUrl: string, index: number) => (
                                    <div key={index} className={styles.customerImageWrapper}>
                                        <Image src={imageUrl} alt={`Customer image ${index + 1}`} fill style={{objectFit: 'cover'}} sizes="100px" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={styles.reviewsListContainer}>
                      <div className={styles.reviewsListHeader}>
                          <input type="search" placeholder="Search customer reviews" className={styles.reviewSearchInput} />
                          <span>{`1-${product.reviews?.nodes?.length || 0} of ${product.reviews?.reviewCount || 0} reviews`}</span>
                          <select className={styles.reviewSortDropdown}>
                              <option>Most Recent</option>
                              <option>Highest Rating</option>
                              <option>Lowest Rating</option>
                          </select>
                      </div>

                      {product.reviews && product.reviews.nodes.length > 0 ? (
                          product.reviews.nodes.map((review: any) => (
                              <div key={review.id} className={styles.reviewItem}>
                                  <div className={styles.reviewAuthor}>
                                      <div className={styles.authorAvatar}>{review.author.node.name.substring(0, 2).toUpperCase()}</div>
                                  </div>
                                  <div className={styles.reviewDetails}>
                                      <div className={styles.reviewHeader}>
                                        <strong>{review.author.node.name}</strong>
                                        <span className={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</span>
                                      </div>
                                      {review.rating && <div className={styles.reviewRating}><StarRating rating={review.rating} /></div>}
                                      <a href="#" className={styles.verifiedLink}>✓ Verified review</a>
                                      <div className={styles.reviewContent} dangerouslySetInnerHTML={{ __html: review.content }} />
                                  </div>
                              </div>
                          ))
                      ) : ( <p>There are no reviews yet.</p> )}
                    </div>
                  </div>
                  
                  <div className={styles.reviewFormWrapper}>
                      <ReviewForm 
                          productId={product.databaseId}
                          averageRating={product.reviews?.averageRating ?? 0}
                          reviewCount={product.reviews?.reviewCount ?? 0}
                      />
                  </div>

                </div>
            </section>

        {product.related && product.related.nodes.length > 0 && (
            <div className={styles.relatedProducts}>
            <h2 className={styles.relatedTitle}>Related Products</h2>
            <div className={styles.relatedGrid}>
                {product.related.nodes.map(relatedProduct => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
            </div>
            </div>
        )}
        </div>
    );
}