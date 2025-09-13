// app/contact/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import styles from './Contact.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState<{ status: 'success' | 'error' | ''; message: string }>({ status: '', message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // এখানে আপনার ফর্ম পাঠানোর জন্য API রুট তৈরি করতে হবে।
    // আপাতত, আমরা একটি ডেমো ফলাফল দেখাব।
    console.log("Form Data Submitted:", formData);
    setFormStatus({ status: 'success', message: "Thanks for your message! We'll get back to you shortly." });
    setFormData({ name: '', email: '', phone: '', message: '' }); // ফর্ম রিসেট
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
                    <p><strong>NSW – ON TWO WHEELS GLEDSWOOD HILLS – CAMDEN CYCLES – ENGADINE CYCLES AND SCOOTERS – SINGLETON BIKE SHOPn:</strong><br /> VIC – TBC in 2026.<br />QLD – TBC in 2026</p>
                </div>
            </div>
            <div className={styles.contactIntroImage}>
                <img src="https://sharifulbuilds.com/wp-content/uploads/2025/09/electric-bike-ebike-for-kids-1.webp" alt="A child confidently riding a GoBike electric balance bike" />
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
                <button type="submit">Send Message</button>
            </form>
            {formStatus.message && (
                <div className={`${styles.formMessage} ${formStatus.status === 'success' ? styles.formSuccess : styles.formError}`}>
                    {formStatus.message}
                </div>
            )}
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