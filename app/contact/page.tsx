'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import styles from './ContactPage.module.css'; // <-- নিশ্চিত করুন এই CSS ফাইলটি আছে
import toast from 'react-hot-toast';
import Image from 'next/image'; // <-- Image কম্পোনেন্ট ইম্পোর্ট করা হয়েছে

export default function ContactPage() {
  // --- কার্যকরী সমাধান: State Management-কে একটি অবজেক্টে রাখা হয়েছে ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // ইনপুট পরিবর্তনের জন্য একটি ফাংশন
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ফর্ম সাবমিট করার জন্য ফাংশন
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    toast.loading('Sending your message...');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      toast.dismiss();

      if (response.ok) {
        setStatus('success');
        toast.success(result.message || 'Message sent successfully!');
        // ফর্ম রিসেট করা হচ্ছে
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      setStatus('error');
      toast.error(error.message || 'Failed to send the message. Please try again.');
    }
  };

  return (
    <div className={styles.gobikeContactPageWrapper}>
      <div className={styles.contactContainer}>
        {/* Top Section: Intro */}
        <div className={styles.contactIntroGrid}>
            <div className={styles.contactIntroText}>
                <h1>Get in Touch With an Ebike Expert</h1>
                <p>Whether you&apos;re looking for the perfect kids <strong>Ebike</strong>, need help with a recent <strong>ebike order</strong>, or just want to chat about bikes, our friendly Australian support team is here to help.</p>
                <p>We aim to respond within the hour via email at <a href="mailto:gobike@gobike.au">gobike@gobike.au</a>. For the quickest response, message us on:</p>
                <div className={styles.contactSocialLinks}>
                    <a href="https://www.facebook.com/Go-Bike-104997195659873" target="_blank" rel="noopener noreferrer" className={styles.socialFacebook}>Facebook</a>
                    <a href="https://www.instagram.com/gobikeoz/" target="_blank" rel="noopener noreferrer" className={styles.socialInstagram}>Instagram</a>
                </div>
                <div className={styles.contactInfoBox}>
                    <p><strong>Warehouse Location:</strong> CAMDEN SOUTH NSW. Please note, pickup is available by request only.</p>
                    <p><strong>Retailer Locations:</strong><br /> NSW – ON TWO WHEELS GLEDSWOOD HILLS – CAMDEN CYCLES – ENGADINE CYCLES AND SCOOTERS – SINGLETON BIKE SHOP<br /> VIC – TBC in 2026.<br />QLD – TBC in 2026</p>
                </div>
            </div>
            <div className={styles.contactIntroImage}>
                {/* --- কার্যকরী সমাধান: Image কম্পোনেন্ট ব্যবহার করা হয়েছে --- */}
                <Image 
                    src="https://sharifulbuilds.com/wp-content/uploads/2025/02/1-Static-1x1-1.webp" 
                    alt="A child confidently riding a GoBike electric balance bike"
                    width={500} // ছবির আসল প্রস্থ দিন
                    height={500} // ছবির আসল উচ্চতা দিন
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                />
            </div>
        </div>

        {/* Middle Section: Contact Form */}
        <div className={styles.gobikeFormContainer}>
            <h2>Send Us a Message</h2>
            <form onSubmit={handleFormSubmit}>
                <input type="text" name="name" placeholder="Your Name *" value={formData.name} onChange={handleInputChange} required />
                <input type="email" name="email" placeholder="Your Email *" value={formData.email} onChange={handleInputChange} required />
                <input type="tel" name="phone" placeholder="Your Phone" value={formData.phone} onChange={handleInputChange} />
                <textarea name="message" placeholder="Your Message *" value={formData.message} onChange={handleInputChange} required></textarea>
                <button type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                </button>
            </form>
            {/* react-hot-toast এখন বার্তা দেখানোর কাজ করবে, তাই এই অংশটির আর প্রয়োজন নেই */}
        </div>

        {/* Bottom Section: Consumer Rights */}
        <div className={styles.consumerRightsSection}>
            <div className={styles.consumerRightsContent}>
                <div><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg></div>
                <h2>Your Rights When Buying an Ebike in Australia</h2>
                <p>At <a href="https://sharifulbuilds.com/">GoBike.au</a>, we are committed to fair and transparent practices. We adhere strictly to all guidelines set by the <strong>Australian Consumer Law</strong> to ensure your rights are protected when purchasing a kids electric bike.</p>
                <p>You have the right to a repair, replacement, or refund for a major failure and compensation for any other reasonably foreseeable loss or damage.</p>
                <a href="https://www.accc.gov.au/" target="_blank" rel="noopener noreferrer" className={styles.consumerRightsButton}>Learn More at ACCC Website</a>
            </div>
        </div>
      </div>
    </div>
  );
}