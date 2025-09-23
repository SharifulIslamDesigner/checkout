// app/terms-and-conditions/page.tsx
'use client';

import Link from 'next/link';
import styles from './Terms.module.css';
import Breadcrumbs from '../../components/Breadcrumbs'; 

export default function TermsAndConditionsPage() {
  return (
    <div>
          <Breadcrumbs />
    <div className={styles.termsPageWrapper}> 
      <div className={styles.termsHeader}>
        <h1>Terms and Conditions</h1>
        <p>Welcome to GoBike.au! These terms outline the rules for using our website and purchasing our <strong>kids electric bikes</strong>. By engaging with our services, you agree to these conditions.</p>
      </div>
      
      <div className={styles.termsHighlightBox}>
        <p><strong>Our Commitment to You:</strong> By choosing GoBike, you’re investing in more than just a premium ride. You’re joining a community that values adventure, quality family time, and is backed by friendly, reliable Aussie support. Make every ride a memory with GoBike.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>1. Definitions</h2>
        <p><strong>“GoBike”</strong>, “we”, “us” refers to our company and website, <a href="https://sharifulbuilds.com/">GoBike.au</a>. <strong>“User”</strong>, “you” refers to any visitor or customer. <strong>“Products”</strong> include our entire range of <strong><Link href="/bikes">electric balance bikes</Link></strong> and <Link href="/products">accessories</Link>.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>2. Eligibility and Safe Use</h2>
        <p>Our products are designed for children aged 2 to 16. All purchases must be completed by an adult. For the safety of your child, we strongly recommend adult supervision during rides and the use of appropriate safety gear, such as helmets.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>3. Orders and Payments</h2>
        <p>All prices are listed in Australian Dollars (AUD) and are inclusive of GST where applicable. Payments are processed securely through our approved gateways. We reserve the right to cancel or modify any order at our discretion, subject to stock availability.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>4. Shipping and Delivery</h2>
        <p>We ship our <strong>Ebike Melbourne</strong> stock and other products across Australia. While delivery times are estimates, we partner with reliable carriers like <a href="https://www.transdirect.com.au/services/interstate-couriers/" target="_blank" rel="noopener noreferrer">Transdirect All Courier </a> to ensure timely delivery. GoBike is not liable for delays caused by third-party couriers.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>5. Returns, Refunds, and Warranty</h2>
        <p>Your satisfaction is important to us. Returns are accepted within 14 days for products in their original, unused condition. Every <strong>kids electric motorbike</strong> is also covered by our full <strong>1-year warranty</strong>. For more details, please see our <Link href="/refund-and-returns-policy">Refund and Returns Policy</Link> page.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>6. Our Commitment to Australian Consumer Law</h2>
        <p>At GoBike, we are committed to fair and transparent practices. We adhere strictly to the guidelines set forth by the <a href="https://www.accc.gov.au/" target="_blank" rel="noopener noreferrer">Australian Competition and Consumer Commission (ACCC)</a>, ensuring your rights under the Australian Consumer Law are always protected.</p>
      </div>
      
      <div className={styles.termsSection}>
        <h2>7. Privacy</h2>
        <p>Your privacy is of utmost importance. To understand how we collect, use, and protect your personal data, please review our comprehensive <Link href="/privacy-policy">Privacy Policy</Link>.</p>
      </div>

      <div className={styles.termsSection}>
        <h2>8. Contact Us</h2>
        <p>For any questions regarding these terms, your order, or choosing the right <strong>ebike for kids</strong>, please visit our <Link href="/contact">Contact Us page</Link> or email us directly at <a href="mailto:gobike@gobike.au">gobike@gobike.au</a>. Our expert team is ready to help! For quick answers, you can also visit our <Link href="/faq">FAQs</Link> page.</p>
      </div>
      
    </div>
    </div>
  );
}