// app/bikes/page.tsx

import { gql } from '@apollo/client';
import Link from 'next/link';
import client from '../../lib/apolloClient';
import styles from './BikesPage.module.css'; // নিশ্চিত করুন এই CSS ফাইলটি আছে
import ProductCard from '../products/ProductCard';
import PaginationControls from '../products/PaginationControls';
import Image from 'next/image';

const PRODUCTS_PER_PAGE = 12;

// --- Interfaces ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
}
interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

// --- ফাংশনটি এখন চূড়ান্তভাবে সঠিক ---
async function getBikeProducts(
    first: number | null,
    after: string | null,
    last: number | null,
    before: string | null
) {
  try {
    const { data } = await client.query({
      query: gql`
        query GetBikesCursor($first: Int, $after: String, $last: Int, $before: String) {
          products(
            where: { category: "bikes" },
            first: $first, after: $after, last: $last, before: $before
          ) {
            nodes {
              id
              databaseId
              name
              slug
              image { sourceUrl }
              ... on SimpleProduct { 
                price(format: FORMATTED)
                regularPrice(format: FORMATTED)
                salePrice(format: FORMATTED)
              }
              ... on VariableProduct { 
                price(format: FORMATTED)
                regularPrice(format: FORMATTED)
                salePrice(format: FORMATTED)
              }
                onSale
            }
            pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
          }
        }
      `,
      variables: { first, after, last, before },
      context: { fetchOptions: { next: { revalidate: 86400 } } },
    });
    return {
      products: data.products.nodes,
      pageInfo: data.products.pageInfo,
    };
  } catch (error) {
    console.error("Error in getBikeProducts:", error);
    return {
      products: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }
}

export default async function BikesPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const after = typeof searchParams.after === 'string' ? searchParams.after : null;
  const before = typeof searchParams.before === 'string' ? searchParams.before : null;

  const { products, pageInfo } = await getBikeProducts(
    before ? null : PRODUCTS_PER_PAGE,
    after,
    before ? PRODUCTS_PER_PAGE : null,
    before
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Australia's Top-Rated Electric Bikes for Kids</h1>
          <p className={styles.heroSubtitle}>
            Give your child the gift of adventure! Our electric balance bikes are engineered for safety, built for fun, and designed to create lifelong memories.
          </p>
          <Link href="#bike-collection" className={styles.heroButton}>Explore The Collection</Link>
        </div>
        <div className={styles.heroImageContainer}>
            <Image 
                src="https://sharifulbuilds.com/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp" // <-- আপনার একটি আকর্ষণীয় ছবি দিন
                alt="Happy child riding a GoBike electric bike"
                width={600}
                height={600}
                priority={true}
                className={styles.heroImage}
            />
        </div>
      </header>
      <main className={styles.productsGridContainer}>
        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>No bikes found.</p>
        )}
        <PaginationControls pageInfo={pageInfo} />
      </main>
      <section className={styles.whyChooseUs}>
        <div className={styles.whyChooseUsImage}>
             <Image 
                src="https://sharifulbuilds.com/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids--scaled.webp" // <-- আরেকটি সুন্দর ছবি দিন
                alt="GoBike parts and features"
                width={500}
                height={500}
                className={styles.sectionImage}
            />
        </div>
        <div className={styles.whyChooseUsContent}>
            <h2>Engineered for Safety, Built for Fun.</h2>
            <p>Every GoBike is more than just a toy. It's a premium-quality ride designed with your child's safety as our number one priority.</p>
            <ul>
                <li><strong>Lightweight & Durable Frame:</strong> Easy for kids to handle, tough enough for any adventure.</li>
                <li><strong>Safe Speed Modes:</strong> Start with a slow learning mode and unlock faster speeds as they grow in confidence.</li>
                <li><strong>Reliable Braking System:</strong> Powerful disc brakes for safe and immediate stopping power.</li>
                <li><strong>Long-Lasting Battery:</strong> More ride time, less charge time. The fun never has to stop!</li>
            </ul>
             <Link href="/about" className={styles.secondaryButton}>Learn Our Story</Link>
        </div>
      </section>

      {/* --- SEO Bottom Section --- */}
      <section className={styles.seoBottomSection}>
        <h2>Your Journey to Adventure Starts Here</h2>
        <p>
          At GoBike, we believe in the power of outdoor play. Our electric bikes are the perfect tool to get your kids off screens and into the great outdoors, building confidence and coordination along the way. We are a proud Aussie brand, committed to providing the best quality and service.
        </p>
        <div className={styles.internalLinks}>
          <Link href="/products" className={styles.internalLink}>Shop All Spare Parts</Link>
          <Link href="/contact" className={styles.internalLink}>Contact Our Team</Link>
          <Link href="/faq" className={styles.internalLink}>Find Answers (FAQ)</Link>
        </div>
      </section>
    </div>
  );
}