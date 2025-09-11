'use client';

import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import styles from './ReviewForm.module.css';
import { FaStar } from 'react-icons/fa';

interface ReviewFormProps {
  productId: number;
  averageRating: number | null | undefined;
  reviewCount: number | null | undefined;
}

const StarRatingDisplay = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    const fullStars = Math.round(rating || 0);
    const emptyStars = totalStars - fullStars;
    return (
        <div className={styles.starDisplay}>
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} color="#ffc107" />)}
            {[...Array(emptyStars)].map((_, i) => <FaStar key={`empty-${i}`} color="#e4e5e9" />)}
        </div>
    );
};

export default function ReviewForm({ productId, averageRating, reviewCount }: ReviewFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    setIsSubmitting(true);
    toast.loading('Submitting your review...');
  const currentRating = typeof averageRating === 'number' ? averageRating : 0;
  const currentReviewCount = typeof reviewCount === 'number' ? reviewCount : 0;

    const endpoint = 'https://sharifulbuilds.com/wp-comments-post.php';
    const formData = new FormData();
    formData.append('author', author);
    formData.append('email', email);
    formData.append('comment', comment);
    formData.append('rating', String(rating));
    formData.append('comment_post_ID', String(productId));
    formData.append('submit', 'Post Comment');
    
   try {
      // *** মূল সমাধান: এখন আমাদের নিজস্ব API Route কল করা হচ্ছে ***
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      toast.dismiss();

      if (result.success) {
        toast.success('Review submitted! It will appear after approval.');
        // ফর্ম রিসেট
        setAuthor(''); setEmail(''); setComment(''); setRating(0); setShowForm(false);
      } else {
        throw new Error(result.message || 'Failed to submit review.');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRating = typeof averageRating === 'number' ? averageRating : 0;
  const currentReviewCount = typeof reviewCount === 'number' ? reviewCount : 0;

  return (
    <div className={styles.reviewWidget}>
        <div className={styles.reviewsSummary}>
            <div className={styles.summaryAverage}>
                <div className={styles.averageRatingValue}>{currentRating.toFixed(1)}</div>
                <StarRatingDisplay rating={currentRating} />
                <div className={styles.basedOnReviews}>Based on {currentReviewCount} reviews</div>
                <button className={styles.addReviewButton} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel Review' : 'Add a review'}
                </button>
            </div>
            <div className={styles.summaryBreakdown}>
                <div className={styles.ratingBarRow}><span>5 star</span><div className={styles.ratingBar}><div style={{width: '100%'}}></div></div><span>100%</span></div>
                <div className={styles.ratingBarRow}><span>4 star</span><div className={styles.ratingBar}><div style={{width: '0%'}}></div></div><span>0%</span></div>
                <div className={styles.ratingBarRow}><span>3 star</span><div className={styles.ratingBar}><div style={{width: '0%'}}></div></div><span>0%</span></div>
                <div className={styles.ratingBarRow}><span>2 star</span><div className={styles.ratingBar}><div style={{width: '0%'}}></div></div><span>0%</span></div>
                <div className={styles.ratingBarRow}><span>1 star</span><div className={styles.ratingBar}><div style={{width: '0%'}}></div></div><span>0%</span></div>
            </div>
        </div>
        
        {showForm && (
            <form onSubmit={handleSubmit} className={styles.reviewForm}>
                <h4>Write a Review</h4>
                <p>Your email address will not be published. Required fields are marked *</p>
                <div className={styles.ratingInput}>
                    <label>Your rating *</label>
                    <div className={styles.stars}>
                        {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;
                        return (
                            <label key={index}>
                            <input type="radio" name="rating" value={ratingValue} onClick={() => setRating(ratingValue)} />
                            <FaStar 
                                className={styles.star} 
                                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"} 
                                onMouseEnter={() => setHover(ratingValue)}
                                onMouseLeave={() => setHover(0)}
                            />
                            </label>
                        );
                        })}
                    </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor='comment'>Your review *</label>
                  <textarea id='comment' value={comment} onChange={e => setComment(e.target.value)} required />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                      <label htmlFor='author'>Your Name *</label>
                      <input id='author' type="text" value={author} onChange={e => setAuthor(e.target.value)} required />
                  </div>
                  <div className={styles.formGroup}>
                      <label htmlFor='email'>Your Email *</label>
                      <input id='email' type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>
        )}
    </div>
  );
}