import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

// --- SEO Metadata (এখন এটি সার্ভার কম্পোনেন্টে থাকায় সঠিকভাবে কাজ করবে) ---
export const metadata: Metadata = {
  title: 'Contact Us | GoBike Australia Support',
  description: 'Have a question about our kids electric bikes? Get in touch with the GoBike Australia team. We are here to help you with your inquiries and provide expert support.',
  alternates: {
    canonical: '/contact',
  },
};
export default function ContactPage() {
  return (
    <ContactPageClient />
  );
}