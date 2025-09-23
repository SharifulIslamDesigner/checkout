import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';
const siteConfig = {
  url: 'https://gobike.au',
  title: 'GoBike - Australia’s Top Rated Kids Electric Balance Bikes',
  description: "Discover Australia's top-rated electric bikes for kids. Safe, fun, and built for adventure. Shop GoBike for the best kids e-bikes with a 1-year local warranty.",
  ogImage: '/og-image.png',
  logo: '/logo.png',
  siteName: 'GoBike Australia',
  facebook: 'https://www.facebook.com/Go-Bike-104997195659873',
  instagram: 'https://www.instagram.com/gobikeoz/',
  youtube: 'https://www.youtube.com/@Gobike-r7b',
  phone: '+61-4-XXXX-XXXX', // <-- আপনার সঠিক ফোন নম্বর দিন
};

// +++ SEO Metadata (এখন এটি সার্ভার কম্পোনেন্টে থাকায় সঠিকভাবে কাজ করবে) +++
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: '/',
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'A child happily riding a GoBike electric bike in an Australian park.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};
export default function Home() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        'name': siteConfig.siteName,
        'url': siteConfig.url,
        'logo': `${siteConfig.url}${siteConfig.logo}`,
        'contactPoint': { '@type': 'ContactPoint', 'telephone': siteConfig.phone, 'contactType': 'Customer Service' },
        'sameAs': [ siteConfig.facebook, siteConfig.instagram, siteConfig.youtube, ]
      },
      {
        '@type': 'WebSite',
        'url': siteConfig.url,
        'name': siteConfig.siteName,
        'potentialAction': { '@type': 'SearchAction', 'target': { '@type': 'EntryPoint', 'urlTemplate': `${siteConfig.url}/search?q={search_term_string}` }, 'query-input': 'required name=search_term_string' }
      }
    ]
  };
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HomePageClient />
    </main>
  );
}