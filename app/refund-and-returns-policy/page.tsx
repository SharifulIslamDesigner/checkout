// app/refund-and-returns-policy/page.tsx

import Head from 'next/head';
import Script from 'next/script';
import styles from './Returns.module.css';

// SEO Schema ডেটা
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is the return eligibility for GoBike products?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We accept returns of unused and undamaged ebike conversion kits and other products within 14 calendar days of delivery. The product must be in brand-new condition, in its original packaging, with all parts included."
    }
  },{
    "@type": "Question",
    "name": "How long does a refund take?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "After we receive and approve your returned item, a full refund is processed to your original payment method within 5 to 7 business days."
    }
  },{
    "@type": "Question",
    "name": "What if my ebike conversion kit arrives damaged?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "If your item arrives damaged, defective, or incorrect, please contact us within 48 hours of delivery. We will arrange a free replacement or a full refund, including all shipping costs."
    }
  }]
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GoBike.au",
  "url": "https://sharifulbuilds.com",
  "logo": "URL_TO_YOUR_LOGO.png", // অনুগ্রহ করে আপনার লোগোর সঠিক URL দিন
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+61-426-067-277",
    "contactType": "Customer Service",
    "email": "support@gobike.au",
    "areaServed": "AU"
  }
};


export default function RefundAndReturnsPolicyPage() {
  return (
    <>
      {/* 
        Next.js 13+ App Router-এ <head> ট্যাগ সরাসরি ব্যবহার করা যায় না।
        এর পরিবর্তে, আমরা metadata অবজেক্ট এক্সপোর্ট করতে পারি অথবা Script কম্পোনেন্ট ব্যবহার করতে পারি।
        ফন্টগুলো layout.tsx-এ যোগ করা ভালো। আপাতত, এটি কাজ করবে।
        SEO Schema যোগ করার জন্য Script কম্পোনেন্ট ব্যবহার করা হচ্ছে।
      */}
      <Script id="faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <Script id="org-schema" type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </Script>
      
      <div className={styles.gobikePolicyPage}>
        <div className={styles.policyContainer}>

            <div className={styles.policyHeader}>
                <h1>Hassle-Free Refund & Return Policy</h1>
                <p>We want you to feel completely confident shopping with us. Our straightforward policy ensures you get the best service and protection for your purchase.</p>
            </div>

            <div className={styles.policySection}>
                <h2>Return Eligibility: What Can You Return?</h2>
                <p>We accept returns of <strong>unused and undamaged</strong> products, including ebike conversion kits, within <strong>14 calendar days</strong> of delivery. To be eligible:</p>
                <ul>
                    <li>The product must be in brand-new condition, with no signs of installation or use.</li>
                    <li>The original packaging must be intact with all accessories, manuals, and parts included.</li>
                    <li>Electrical components like batteries must remain unopened and unused for safety reasons.</li>
                </ul>
                <div className={styles.highlightBox}>
                    <p><strong>Please Note:</strong> The cost of return shipping is borne by the customer, unless the item was delivered faulty. We highly recommend using a tracked postal service.</p>
                </div>
            </div>

            <div className={styles.policySection}>
                <h2>Refund Process: How It Works</h2>
                <p>Once we receive and inspect your return, an approved refund will be processed to your original payment method within <strong>5 to 7 business days</strong>. You will receive an email confirmation.</p>
                <div className={`${styles.highlightBox} ${styles.warningBox}`}>
                    <p>If a product shows signs of use, damage, or is missing components, we reserve the right to apply a restocking fee of up to 20% or, in some cases, reject the return.</p>
                </div>
            </div>

            <div className={styles.policySection}>
                <h2>Faulty, Damaged, or Incorrect Items</h2>
                <p>If your <strong>ebike conversion kit</strong> or any item arrives damaged or defective, please <strong>contact us within 48 hours</strong> of delivery. We will offer a replacement at no extra cost or a full refund, including return shipping.</p>
            </div>

            <div className={styles.policySection}>
                <h2>How to Initiate a Return</h2>
                <ol>
                    <li><strong>Contact us via email at <a href="mailto:gobike@gobike.au">gobike@gobike.au</a></strong>.</li>
                    <li>Provide your <strong>order number</strong> and the reason for your return.</li>
                    <li><strong>Attach photos</strong> if the item is damaged or faulty (this speeds up the process).</li>
                    <li>Our team will reply within 1 business day with return instructions.</li>
                </ol>
            </div>

            <div className={`${styles.policySection} ${styles.finalSummary}`}>
                <h2>Summary of Our Policy</h2>
                <ul>
                    <li><strong>14-day return window</strong> for new and unused items.</li>
                    <li>Full refunds processed within 5-7 business days after inspection.</li>
                    <li>Faulty or damaged items are replaced or fully refunded at our cost.</li>
                    <li>Simple exchange and upgrade options are available.</li>
                    <li>Full compliance with <strong>Australian Consumer Law</strong>.</li>
                </ul>
            </div>
            
            <div className={styles.policySection}>
                <h2>Need Help with Your Return?</h2>
                <p>Your satisfaction is our top priority. If you have any questions, our local Aussie support team is here to help you every step of the way.</p>
                <div className={styles.contactInfoBlock}>
                    <p><strong>Business Name:</strong> GoBike.au<br />
                    <strong>Email:</strong> <a href="mailto:support@gobike.au">support@gobike.au</a><br />
                    <strong>Phone:</strong> +61 426 067 277<br />
                    <strong>Website:</strong> <a href="https://sharifulbuilds.com">https://sharifulbuilds.com</a></p>
                </div>
            </div>

        </div>
      </div>
    </>
  );
