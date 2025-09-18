'use client';

import { useState, useEffect } from 'react';
import styles from './ProductPage.module.css';
import Image from 'next/image';
import QuantityAddToCart from '../../../components/QuantityAddToCart';
import ReviewForm from './ReviewForm';
import ProductCard from '../../products/ProductCard';
import { gtmViewItem } from '../../../lib/gtm';
import { klaviyoTrackViewedProduct } from '../../../lib/klaviyo';

// --- ইন্টারফেসগুলো নতুন ডেটা স্ট্রাকচার অনুযায়ী আপডেট করা হয়েছে ---
interface ImageNode { sourceUrl: string; }
interface Attribute { name: string; options: string[]; }
interface ReviewEdge {
  rating: number;
  node: {
    id: string;
    author: { node: { name: string; avatar?: { url: string } }; };
    content: string;
    date: string;
  };
}
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
  onSale: boolean;
  regularPrice?: string;
  salePrice?: string;
  attributes: { nodes: Attribute[]; };
  averageRating: number;
  reviewCount: number;
  reviews: { 
    edges: ReviewEdge[];
  };
  related: { nodes: RelatedProduct[]; };
}
// ----------------------------------------------------------------------


// StarRating কম্পোনেন্ট (টাইপিং ভুল সংশোধন করা হয়েছে)
const StarRating = ({ rating }: { rating: number }) => {
    // --- কার্যকরী সমাধান: `useState` এর 'S' বড় হাতের হবে ---
    const [starRating, setStarRating] = useState({ full: 0, empty: 5 });

    useEffect(() => {
        const totalStars = 5;
        const fullStars = Math.round(rating || 0);
        const emptyStars = totalStars - fullStars;
        setStarRating({ full: fullStars, empty: emptyStars });
    }, [rating]);

    return (
        <div className={styles.starRating}>
            {[...Array(starRating.full)].map((_, i) => <span key={`full-${i}`}>★</span>)}
            {[...Array(starRating.empty)].map((_, i) => <span key={`empty-${i}`}>☆</span>)}
        </div>
    );
};

// FormattedDate কম্পোনেন্ট (ক্লায়েন্ট-সাইড রেন্ডারিং সহ, অপরিবর্তিত)
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        setFormattedDate(new Date(dateString).toLocaleDateString());
    }, [dateString]);

    if (!formattedDate) {
        return <span className={styles.reviewDate}></span>;
    }

    return <span className={styles.reviewDate}>{formattedDate}</span>;
};


export default function ProductClient({ product }: { product: Product }) {
    const [mainImage, setMainImage] = useState<string | undefined>(product.image?.sourceUrl);
    const parsePrice = (priceStr?: string): number => {
        if (!priceStr) return 0;
        return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    };
    const INITIAL_REVIEWS_TO_SHOW = 5;
    const [visibleReviews, setVisibleReviews] = useState(INITIAL_REVIEWS_TO_SHOW);

    const regularPriceNum = parsePrice(product.regularPrice);
    const salePriceNum = parsePrice(product.salePrice);
    const discountPercent = regularPriceNum > 0 && salePriceNum < regularPriceNum 
        ? Math.round(((regularPriceNum - salePriceNum) / regularPriceNum) * 100) 
        : 0;
    useEffect(() => {
        if (product) {
            const priceString = product.salePrice || product.price || '0';
            const priceNum = parseFloat(priceString.replace(/[^0-9.]/g, ''));
            
            gtmViewItem({
                item_name: product.name,
                item_id: product.databaseId,
                price: priceNum,
                quantity: 1
            });
            klaviyoTrackViewedProduct({
                ProductID: product.databaseId,
                ProductName: product.name,
                Quantity: 1,
                ItemPrice: priceNum,
                RowTotal: priceNum,
                ProductURL: `${window.location.origin}/product/${product.slug}`,
                ImageURL: product.image?.sourceUrl || '',
            });
        }
    }, [product]);
           
        
    if (!product) return null;
    const allReviews = product.reviews?.edges || [];
    const hasMoreReviews = allReviews.length > visibleReviews;

    const productForCart = {
        id: product.id,
        databaseId: product.databaseId,
        name: product.name,
        price: product.price,
        image: product.image?.sourceUrl,
    };

    const allImages = [product.image, ...product.galleryImages.nodes].filter(Boolean) as ImageNode[];
    
    const customerImages = product.reviews?.edges
        ?.map((edge: ReviewEdge) => edge.node.author.node.avatar?.url)
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
                <div className={styles.rating}>★★★★☆</div> {/* এটিকে ডাইনামিক করতে চাইলে StarRating কম্পোনেন্ট ব্যবহার করতে পারেন */}
                {product.reviewCount > 0 ? (
                    <a href="#reviews" className={styles.reviewsCount}>({product.reviewCount} customer reviews)</a>
                ) : (
                    <div className={styles.reviewsCount}>(No reviews yet)</div>
                )}
            </div>
            <div className={styles.priceWrapper}>
                <img src="https://gobike.au/wp-content/uploads/2025/08/hot-deal.svg" alt="Hot Deal" className={styles.dealBadge} />
                {product.onSale && product.salePrice ? (
        <div className={styles.salePriceContainer}>
            <span className={styles.regularPriceStriked} dangerouslySetInnerHTML={{ __html: product.regularPrice || '' }} />
            <span className={styles.salePrice} dangerouslySetInnerHTML={{ __html: product.salePrice }} />
            {discountPercent > 0 && (
                <span className={styles.discountBadge}>-{discountPercent}%</span>
            )}
        </div>
    ) : (
        <div className={styles.productPrice} dangerouslySetInnerHTML={{ __html: product.price || '' }} />
    )}
            </div>
            {product.shortDescription && (
                <div 
                className={styles.shortDescription} 
                dangerouslySetInnerHTML={{ __html: product.shortDescription.replace(/<ul>/g, `<ul class="${styles.featuresGrid}">`).replace(/<li>/g, `<li class="${styles.featureItem}">`) }} 
                />
            )}
            <QuantityAddToCart product={productForCart} />

            <div className={styles.producttrustfeatureswrapper}>
              <div className={styles.trustfeaturesgrid}>
                  <div className={styles.trustfeatureitem}>✓ 100% Secure Checkout</div>
                  <div className={styles.trustfeatureitem}>✓ 30 Days Easy Returns</div>
                  <div className={styles.trustfeatureitem}>✓ 1 Year Full Warranty</div>
                  <div className={styles.trustfeatureitem}>✓ Fast Shipping Aus-Wide</div>
               </div>
            </div>
            <div className={styles.checkoutGuarantee}>
                <p className={styles.guaranteeText}>Guaranteed Safe Checkout</p>
                <img src="https://themedemo.commercegurus.com/shoptimizer-demodata/wp-content/uploads/sites/53/2018/07/trust-symbols_a.jpg" alt="Payment Methods" className={styles.paymentLogos} />
            </div>
            </div>
        </div>
        <div className={styles.lowerSectionsWrapper}>
        {product.description && (
            <section className={styles.productInfoSection}>
            <h2 className={styles.sectionTitle}>Description</h2>
            <div className={styles.sectionContent} dangerouslySetInnerHTML={{ __html: product.description }} />
            </section>
        )}

        {(product.weight || (product.length && product.width && product.height) || (product.attributes && product.attributes.nodes.length > 0)) && (
    <section className={styles.productInfoSection}>
        <h2 className={styles.sectionTitle}>Additional Information</h2>
        <div className={styles.sectionContent}>
            <table className={styles.attributesTable}>
                <tbody>
                    {/* ওজন দেখানোর জন্য নতুন সারি */}
                    {product.weight && (
                        <tr>
                            <th>Weight</th>
                            <td>{product.weight} kg</td>
                        </tr>
                    )}

                    {/* মাপ দেখানোর জন্য নতুন সারি */}
                    {product.length && product.width && product.height && (
                        <tr>
                            <th>Dimensions</th>
                            <td>{`${product.length} × ${product.width} × ${product.height} cm`}</td>
                        </tr>
                    )}

                    {/* আপনার পুরোনো অ্যাট্রিবিউট দেখানোর কোড */}
                    {product.attributes?.nodes.map((attr: { name: string, options: string[] }, index: number) => (
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
    <h2 className={styles.sectionTitle}>Customer Reviews</h2>
        <div className={styles.reviewsGrid}>

            {/* --- রিভিউ ফর্ম (অপরিবর্তিত) --- */}
            <div className={styles.reviewFormWrapper}>
                    <ReviewForm 
                        productId={product.databaseId}
                        averageRating={product.averageRating ?? 0}
                        reviewCount={product.reviewCount ?? 0}
                    />
            </div>

            {/* --- রিভিউ তালিকা (এখানে পরিবর্তন করা হয়েছে) --- */}
            <div className={styles.reviewsList}>
                {customerImages.length > 0 && (
                <div className={styles.customerImagesSection}>
                    <h3>Customer Images</h3>
                        <div className={styles.customerImagesGrid}>
                            {customerImages.map((imageUrl: string, index: number) => (
                            <div key={index} className={styles.customerImageWrapper}>
                                <Image src={imageUrl} alt={`Customer image ${index + 1}`} fill style={{objectFit: 'cover'}} sizes="100px" />
                            </div>    ))}
                </div>
            </div>
        )}
        <div className={styles.reviewsListContainer}>
            <div className={styles.reviewsListHeader}>
                <input type="search" placeholder="Search customer reviews" className={styles.reviewSearchInput} />
                {/* --- কার্যকরী সমাধান: এখানে `visibleReviews` ব্যবহার করা হয়েছে --- */}
                <span>{`1-${Math.min(visibleReviews, allReviews.length)} of ${allReviews.length} reviews`}</span>
                <select className={styles.reviewSortDropdown}>
                    <option>Most Recent</option>
                    <option>Highest Rating</option>
                    <option>Lowest Rating</option>
                </select>
            </div>

                {allReviews.length > 0 ? (
                    // --- কার্যকরী সমাধান: শুধুমাত্র `visibleReviews` পর্যন্ত দেখানো হচ্ছে ---
                    allReviews.slice(0, visibleReviews).map((edge: ReviewEdge) => (
                        <div key={edge.node.id} className={styles.reviewItem}>
                            <div className={styles.reviewAuthor}>
                                <div className={styles.authorAvatar}>{edge.node.author.node.name.substring(0, 2).toUpperCase()}</div>
                            </div>
                            <div className={styles.reviewDetails}>
                                <div className={styles.reviewHeader}>
                                    <strong>{edge.node.author.node.name}</strong>
                                <FormattedDate dateString={edge.node.date} />
                                </div>
                            {typeof edge.rating === 'number' && edge.rating > 0 && 
                            <div className={styles.reviewRating}><StarRating rating={edge.rating} /></div>
                            }
                            <a href="#" className={styles.verifiedLink}>✓ Verified review</a>
                            <div className={styles.reviewContent} dangerouslySetInnerHTML={{ __html: edge.node.content }} />
                        </div>
                    </div>
                ))
                ) : ( <p>There are no reviews yet.</p> )}
            
            {/* --- কার্যকরী সমাধান: "See More" বাটন যোগ করা হয়েছে --- */}
            {hasMoreReviews && (
                <div className={styles.showMoreContainer}>
                    <button 
                        className={styles.showMoreButton} 
                        onClick={() => setVisibleReviews(allReviews.length)}
                    >
                        Show All {allReviews.length} Reviews
                    </button>
                </div>
            )}
            {/* ---------------------------------------------------- */}
            </div>
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
        </div>
    );
    
}