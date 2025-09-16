// app/bikes/page.tsx

import { gql } from '@apollo/client';
import Link from 'next/link';
import client from '../../lib/apolloClient';
import styles from './SparePartsPage.module.css'; // নিশ্চিত করুন এই CSS ফাইলটি আছে
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
            where: { category: "spare-parts" },
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
                averageRating
                reviewCount
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
          <h1 className={styles.heroTitle}>Genuine GoBike Spare Parts & Accessories</h1>
          <p className={styles.heroSubtitle}>
            Keep the adventure going! Find all the genuine replacement parts and cool accessories you need to maintain and customize your GoBike.
          </p>
          <Link href="#spare-parts-collection" className={styles.heroButton}>Explore Parts</Link>
        </div>
        <div className={styles.heroImageContainer}>
            <Image 
                src="https://sharifulbuilds.com/wp-content/uploads/2025/09/Electric-Balance-Bike-Electric-bike-Balance-Bike-scaled-1.webp" // <-- Spare Parts সম্পর্কিত একটি ছবি দিন
                alt="GoBike spare parts and accessories"
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
                src="https://sharifulbuilds.com/wp-content/uploads/2025/09/Electric-Balance-Bike-Electric-bike-Balance-Bike-Bike-baby-bike-E-bike-Electric-bike-E-bike-review-Electric-bike-review-Buy-e-bike-Buy-electric-bike-E-bike-price-Electric-bike-price-E-b-.webp" // <-- আরেকটি সুন্দর ছবি দিন
                alt="GoBike genuine parts quality"
                width={500}
                height={500}
                className={styles.sectionImage}
            />
        </div>
        <div className={styles.whyChooseUsContent}>
            <h2>Why Choose Genuine GoBike Parts?</h2>
            <p>Don't settle for less. Our genuine spare parts are manufactured to the same high standards as our bikes, ensuring perfect fit, maximum safety, and peak performance.</p>
            <ul>
                <li><strong>Perfect Fit Guarantee:</strong> Designed specifically for your GoBike model.</li>
                <li><strong>Uncompromised Safety:</strong> Built with the same quality materials for total peace of mind.</li>
                <li><strong>Peak Performance:</strong> Restore your bike to its original performance and glory.</li>
                <li><strong>Easy Installation:</strong> Get back to riding faster with parts that are easy to install.</li>
            </ul>
             <Link href="/bikes" className={styles.secondaryButton}>Shop All Bikes</Link>
        </div>
      </section>

      {/* --- SEO Bottom Section --- */}
      <section className={styles.seoBottomSection}>
        <h2>Your Journey to Adventure Starts Here</h2>
        <p>
          At GoBike, we believe in the power of outdoor play. Our electric bikes are the perfect tool to get your kids off screens and into the great outdoors, building confidence and coordination along the way. We are a proud Aussie brand, committed to providing the best quality and service.
        </p>
        <div className={styles.internalLinks}>
          <Link href="/contact" className={styles.internalLink}>Contact Our Team</Link>
          <Link href="/faq" className={styles.internalLink}>Find Answers (FAQ)</Link>
        </div>
      </section>
    </div>
  );
}