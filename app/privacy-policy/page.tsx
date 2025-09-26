import styles from './Privacy.module.css'; // <-- CSS মডিউল ইম্পোর্ট করা হচ্ছে
import Breadcrumbs from '../../components/Breadcrumbs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | GoBike Australia',
  description: 'Read how GoBike Australia collects, uses, and protects your personal data. Your privacy is important to us. Learn more about our commitment to data security.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    // *** মূল সমাধান: সব className এখন {styles....} ব্যবহার করছে ***
    <div>
          <Breadcrumbs />
    <div className={styles.privacyPolicyContent}>
        <h1>Privacy Policy for GoBike.au</h1>
        <p className={styles.lastUpdated}>Last Updated: 12 August 2025</p>
        
        <p>At <strong><a href="https://sharifulbuilds.com/">GoBike.au</a></strong>, your privacy is our priority. This Privacy Policy outlines how we collect, use, and protect your personal information when you browse or shop for your next <strong>Kids Ebike</strong> on our website. We are fully compliant with the Australian Privacy Principles (APPs) as set out in the <em><a href="https://www.oaic.gov.au/privacy/privacy-legislation/the-privacy-act">Privacy Act 1988 (Cth)</a></em>.</p>

        <h2>1. What Information We Collect</h2>
        <p>When you interact with GoBike.au, we may collect the following information to provide you with the best service:</p>
        <ul>
          <li><strong>Personal Details:</strong> Full name, contact number, and email address.</li>
          <li><strong>Order Information:</strong> Shipping and billing addresses for your <strong>Ebike for kids</strong> purchase.</li>
          <li><strong>Payment Details:</strong> Your payment information is not stored by us. It is processed securely through trusted and PCI-DSS compliant gateways like Stripe and PayPal.</li>
          <li><strong>Browsing Data:</strong> We use cookies and analytics tools like Google Analytics to understand browsing behaviour, which helps us improve our website and product listings.</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <p>Your data is used exclusively to enhance your experience with GoBike.au. This includes:</p>
        <ul>
          <li>Fulfilling and processing your orders for any <strong>Kids Ebike</strong> or accessory.</li>
          <li>Providing timely customer support and responding to your enquiries.</li>
          <li>Sending you marketing communications, such as promotions and newsletters, but only if you have explicitly opted in.</li>
          <li>Improving our website, products, and services based on customer feedback and browsing patterns.</li>
        </ul>
        
        <h2>3. Data Security: Our Commitment to You</h2>
        <p>We take the security of your personal data very seriously. Our website is protected with multiple layers of security to ensure your information is safe:</p>
        <ul>
          <li><strong>SSL Encryption:</strong> Our entire website uses SSL (Secure Socket Layer) encryption to protect data transmitted between your browser and our server.</li>
          <li><strong>Secure Payment Gateways:</strong> We never store your full credit card details. All transactions are handled by industry-leading, secure payment processors.</li>
          <li><strong>Regular Audits:</strong> Our infrastructure is regularly audited to protect against vulnerabilities and ensure the highest level of security.</li>
        </ul>

        <h2>4. Your Rights and Choices</h2>
        <p>In accordance with Australian Privacy Law, you have full control over your personal information. You have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Request a correction to any information that is inaccurate or out of date.</li>
          <li>Request the deletion of your personal data from our systems.</li>
          <li>Opt-out of marketing communications at any time.</li>
        </ul>
        <p>To exercise these rights, please contact us using the details below. For more information on your privacy rights, you may visit the official website of the <a href="https://www.oaic.gov.au/" target="_blank" rel="noopener noreferrer">Office of the Australian Information Commissioner (OAIC)</a>.</p>

        <h2>5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy or how we handle your data, please do not hesitate to reach out. Our friendly Aussie team is always here to help.</p>
        <ul>
          <li><strong>Business Name:</strong> GoBike.au</li>
          <li><strong>Email:</strong> <a href="mailto:gobike@gobike.au">gobike@gobike.au</a></li>
          <li><strong>Phone:</strong> <a href="tel:+61426067277">+61 426067277</a></li>
        </ul>
        
        <div className={styles.contactBox}>
          <h2>Have Questions?</h2>
          <p>Your trust is important to us. If you have any questions at all about your privacy, please <a href="https://gobike.au/contact-us-ebike-expertin-australia-kids-electric-bike/">contact our friendly Aussie team</a>. For quick answers, you can also visit our <a href="https://sharifulbuilds.com/faq-page-kids-ebike-in-australia/">FAQs</a> page or explore the latest product range on our  <a href="https://sharifulbuilds.com/products/bikes/">Shop page</a>.</p>
        </div>
    </div>
    </div>
  );
}