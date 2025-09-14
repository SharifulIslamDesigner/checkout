'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import styles from './HomePageReviews.module.css';

// --- টাইপ ইন্টারফেস ---
interface ReviewSummary {
  review_count: number;
  average_rating: number;
  rating_counts: { rating: number; count: number; }[];
}
interface Review {
  id: number;
  reviewer: string;
  review: string;
  rating: number;
  date: string;
  product_name: string;
  product_permalink: string;
  product_image?: string;
}
interface ReviewsData {
  summary: ReviewSummary;
  reviews: Review[];
}

// --- স্টার রেটিং কম্পোনেন্ট ---
const StarRating = ({ rating, size = 1 }: { rating: number, size?: number }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const emptyStars = totalStars - fullStars;
    return (
        <div className={styles.starRating} style={{ fontSize: `${size}rem` }}>
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} style={{ color: '#e4e5e9' }} />)}
        </div>
    );
};


// --- মূল রিভিউ সেকশন কম্পוננט ---
export default function HomePageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3);

  // --- নতুন: ক্লায়েন্ট-সাইডে সারাংশ গণনার জন্য স্টেট ---
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    async function fetchReviewsData() {
      try {
        const response = await fetch('//sharifulbuilds.com/wp-json/gobike/v1/reviews-summary');
        if (!response.ok) throw new Error('Failed to fetch reviews data');
        const result: ReviewsData = await response.json();
        setReviews(result.reviews);

        // --- কার্যকরী সমাধান: ক্লায়েন্ট-সাইডে সারাংশ গণনা করুন ---
        if (result.reviews.length > 0) {
            const reviewCount = result.reviews.length;
            const totalRating = result.reviews.reduce((acc, review) => acc + review.rating, 0);
            const averageRating = totalRating / reviewCount;

            const ratingCounts = [5, 4, 3, 2, 1].map(star => {
                return {
                    rating: star,
                    count: result.reviews.filter(r => r.rating === star).length
                };
            });

            setSummary({
                review_count: reviewCount,
                average_rating: averageRating,
                rating_counts: ratingCounts
            });
        }
        // --------------------------------------------------------

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchReviewsData();
  }, []);

  if (loading) {
    return <section className={styles.reviewsSection}><div className={styles.container}><p>Loading Reviews...</p></div></section>;
  }

  if (reviews.length === 0) {
    return null;
  }
  
  // রেটিং বারের জন্য শতাংশ গণনা (এখন এটি ক্লায়েন্ট-সাইড summary থেকে আসবে)
  const ratingPercentages = summary?.rating_counts.map(item =>
    summary.review_count > 0 ? (item.count / summary.review_count) * 100 : 0
  );

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>What our customers are saying about Gobike</h2>
        </div>

        {/* --- রিভিউ সারাংশ বক্স (এখন এটি ক্লায়েন্ট-সাইড summary থেকে আসবে) --- */}
        {summary && summary.review_count > 0 && (
          <div className={styles.summaryBox}>
              <div className={styles.summaryAverage}>
                  <div className={styles.averageRatingValue}>{summary.average_rating.toFixed(1)}</div>
                  <StarRating rating={summary.average_rating} size={1.2} />
                  <div className={styles.basedOnReviews}>Based on {summary.review_count} reviews</div>
              </div>
              <div className={styles.summaryBreakdown}>
                  {ratingPercentages?.map((percent, index) => (
                      <div className={styles.ratingBarRow} key={5 - index}>
                          <span>{5 - index} star</span>
                          <div className={styles.ratingBar}><div style={{ width: `${percent}%` }}></div></div>
                          <span>{Math.round(percent)}%</span>
                      </div>
                  ))}
              </div>
              <div className={styles.addReviewWrapper}>
                  {/* আপনি চাইলে এটিকে একটি পেজে লিঙ্ক করতে পারেন */}
                  <span className={styles.addReviewButton}>Add a review</span>
              </div>
          </div>
        )}

        {/* --- সর্বশেষ রিভিউ তালিকা --- */}
        <div className={styles.reviewsGrid}>
          {reviews.slice(0, visibleReviews).map((review) => {
             const productSlug = review.product_permalink.split('/').filter(Boolean).pop() || '';
             return (
                <div key={review.id} className={styles.reviewCard}>
                    
                    {/* --- কার্যকরী সমাধান: নতুন JSX গঠন --- */}
                    <div className={styles.reviewCardHeader}>
                        <div className={styles.authorAvatar}>{review.reviewer.substring(0, 1)}</div>
                        <div className={styles.authorDetails}>
                            <strong>{review.reviewer}</strong>
                            <span className={styles.verifiedBadge}>✓ Verified</span>
                        </div>
                    </div>

                    <StarRating rating={review.rating} />
                    
                    <div 
                        className={styles.reviewContent}
                        dangerouslySetInnerHTML={{ __html: review.review }}
                    />

                    <div className={styles.reviewProductInfo}>
                        {review.product_image && (
                            <Link href={`/product/${productSlug}`}>
                                <Image src={review.product_image} alt={review.product_name} width={40} height={40} />
                            </Link>
                        )}
                        <span>on <Link href={`/product/${productSlug}`}>{review.product_name}</Link></span>
                    </div>
                </div>
             );
          })}
        </div>
        
        {reviews.length > visibleReviews && (
            <div className={styles.showMoreContainer}>
                <button onClick={() => setVisibleReviews(reviews.length)} className={styles.showMoreButton}>
                    Show more reviews ({reviews.length - visibleReviews} more)
                </button>
            </div>
        )}

      </div>
    </section>
  );
}