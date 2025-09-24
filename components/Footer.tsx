'use client';
import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css'; // <-- CSS মডিউল ইম্পোর্ট করা হচ্ছে

export default function Footer() {
  const [email, setEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle'); // <-- নতুন স্টেট

  const handleSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setFeedbackMessage('Subscribing...');

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'An error occurred.');
        }

        setStatus('success');
        setFeedbackMessage(result.message);
        setEmail('');

    } catch (error: unknown) {
        setStatus('error');
        let errorMessage = 'Failed to subscribe. Please try again.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    setFeedbackMessage(errorMessage);
    
    } finally {
        // মেসেজটি ৫ সেকেন্ড পর মুছে যাবে
        setTimeout(() => {
            setFeedbackMessage('');
            setStatus('idle');
        }, 5000);
    }
  };

  return (
    // *** মূল সমাধান: সব className এখন {styles['...']} ব্যবহার করছে ***
    <footer id="colophon" className={styles['site-footer-v6']}>
      <div className={styles['footer-subscription-section-v6']}>
          <div className={styles['subscription-container-v6']}>
              <div className={styles['subscription-text-v6']}>
                  <h3>SIGN UP FOR YOUR CHANCE TO WIN A GOBIKE!</h3>
                  <p>We are giving away a new Gobike to one of our subscribers. All you need to do is subscribe, and you could be our winner! Good luck 👍</p>
              </div>
              <div>
                  <form className={styles['subscription-form-v6']} onSubmit={handleSubscription}>
                      <input type="email" name="subscriber_email" placeholder="email@address.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      <button type="submit">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                          <span>Sign Up</span>
                      </button>
                  </form>
                  {feedbackMessage && <p className={`${styles['subscription-feedback-v6']} ${status === 'success' ? styles['feedback-success-v6'] : styles['feedback-error-v6']}`}>{feedbackMessage}</p>}
              </div>
          </div>
      </div>

      <div className={styles['final-footer-wrapper-v6']}>
          <div className={styles['final-footer-grid-v6']}>
              <div className={`${styles['final-footer-column-v6']} ${styles['logo-column-v6']}`}><Image src="https://gobikes.au/wp-content/uploads/2025/06/GOBIKE-Electric-Bike-for-kids.webp" alt="GoBike Australia Logo"  width={1861} height={430} className={styles['final-footer-logo-v6']} /></div>
              <div className={`${styles['final-footer-column-v6']} ${styles['follow-column-v6']}`}>
  <h3>Follow Us</h3>
  <ul>
    <li>
      <a href="https://www.facebook.com/Go-Bike-104997195659873" target="_blank" rel="noopener noreferrer">
        <FaFacebookF className={styles['final-footer-social-icon-v1']} />
        <span>Facebook</span>
      </a>
    </li>
    <li>
      <a href="https://www.instagram.com/gobikeoz/" target="_blank" rel="noopener noreferrer">
        <FaInstagram className={styles['final-footer-social-icon-v2']} />
        <span>Instagram</span>
      </a>
    </li>
    <li>
      <a href="https://www.youtube.com/@Gobike-r7b" target="_blank" rel="noopener noreferrer">
        <FaYoutube className={styles['final-footer-social-icon-v3']} />
        <span>Youtube</span>
      </a>
    </li>
    <li>
      <a href="https://www.tiktok.com/@gobikeoz" target="_blank" rel="noopener noreferrer">
        <FaTiktok className={styles['final-footer-social-icon-v4']} />
        <span>TikTok</span>
      </a>
    </li>
  </ul>
</div>
              <div className={`${styles['final-footer-column-v6']} ${styles['quick-column-v6']}`}>
                  <h3>Quick Links</h3>
                  <ul>
                      <li><Link href="/">Home</Link></li>
                      <li><Link href="/bikes">Bikes</Link></li>
                      <li><Link href="/products">Spare Parts</Link></li>
                      <li><Link href="/about">About</Link></li>
                      <li><Link href="/blog" >Blog</Link></li>
                  </ul>
              </div>
              <div className={`${styles['final-footer-column-v6']} ${styles['customers-column-v6']}`}>
                  <h3>Customers</h3>
                  <ul>
                      <li><a href="https://gobikes.au/my-account/">Log In/Register</a></li>
                      <li><Link href="/contact">Contact Us</Link></li>
                      <li><Link href="/faq">FAQs</Link></li>
                      <li><Link href="/terms-and-conditions">Terms & Condition</Link></li>
                      <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                      <li><Link href="/refund-and-returns-policy">Refund and Returns Policy</Link></li>
                  </ul>
              </div>
              <div className={`${styles['final-footer-column-v6']} ${styles['promise-column-v6']}`}>
                  <h3>Our Promise</h3>
                  <div className={styles['promise-item-v6']}>
                      <svg className={styles['promise-icon-v6']} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
                      <span>1 Year Full Warranty</span>
                  </div>
                  <div className={styles['promise-item-v6']}>
                      <svg className={styles['promise-icon-v6']} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1"/></svg>
                      <span>Fast Shipping Aus-Wide</span>
                  </div>
                  <div className={styles['promise-item-v6']}>
                      <svg className={styles['promise-icon-v6']} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
                      <span>Expert Aussie Support</span>
                  </div>
                  <div className={styles['promise-item-v6']}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      <span>100% Secure Checkout</span>
                  </div>
                  <div className={styles['promise-item-v6']}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                      <span>Easy 30 days returns</span>
                  </div>
              </div>
          </div>
      </div>
      
      <div className={styles['footer-bottom-bar-v6']}>
          <div className={styles['bottom-bar-container-v6']}>
              <div className={styles['copyright-text-v6']}>Copyright &copy; {new Date().getFullYear()} GoBike All Rights Reserved</div>
              <div className={styles['trust-symbols-v6']}>
                  <Image src="https://gobikes.au/wp-content/uploads/2018/07/trust-symbols_b.jpg" width={1600} height={168} alt="Secure Payment Methods" />
              </div>
          </div>
      </div>
    </footer>
  );
}