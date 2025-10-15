import { gql } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

// --- সমাধান: সঠিক ফাইল থেকে getClient import করা হচ্ছে ---
import { getClient } from '../../lib/apollo-rsc-client';

import styles from './BikesPage.module.css';
import ProductCard from '../products/ProductCard';
import PaginationControls from '../products/PaginationControls';
import Breadcrumbs from '../../components/Breadcrumbs';

const PRODUCTS_PER_PAGE = 12;

// --- Interfaces ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
  onSale: boolean;
  salePrice?: string;
  regularPrice?: string;
  averageRating?: number;
  reviewCount?: number;
}
interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
interface QueryData {
  products: {
    nodes: Product[];
    pageInfo: PageInfo;
  } | null;
}
// --- SEO: Dynamic Metadata Function ---
export async function generateMetadata(): Promise<Metadata> {
  const title = "Shop All Kids Top Rated Electric Bikes";
  const description = "Browse our full collection of top-rated electric balance bikes for kids of all ages. Safe, durable, and built for adventure. Find the perfect e-bike for your child today!";
  
  return {
    title,
    description,
    alternates: {
      canonical: '/bikes',
    },
    openGraph: {
      title,
      description,
      url: '/bikes',
    }
  };
}


// --- Data Fetching Function ---
async function getBikeProducts(
    first: number | null,
    after: string | null,
    last: number | null,
    before: string | null
) {
  try {
    // --- সমাধান: getClient() এখন সঠিকভাবে কাজ করবে ---
    const { data } = await getClient().query<QueryData>({
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
              ... on SimpleProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) }
              ... on VariableProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) }
              onSale
              averageRating
              reviewCount
            }
            pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
          }
        }
      `,
      variables: { first, after, last, before },
      context: { fetchOptions: { next: { revalidate: 50000 } } },
    });
    if (!data || !data.products) {
        console.error("No spare parts data returned from GraphQL query.");
        return {
            products: [],
            pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
        };
    }
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

// --- Page Component ---
export default async function BikesPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = await searchParams;
  const after = typeof resolvedSearchParams.after === 'string' ? resolvedSearchParams.after : null;
  const before = typeof resolvedSearchParams.before === 'string' ? resolvedSearchParams.before : null;

  const { products, pageInfo } = await getBikeProducts(
    before ? null : PRODUCTS_PER_PAGE,
    after,
    before ? PRODUCTS_PER_PAGE : null,
    before
  );

  return (
    <div>
      <Breadcrumbs pageTitle="All Bikes" />
      <div className={styles.pageContainer}>
        
        <header className={styles.header}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Australias Top-Rated Electric Bikes for Kids</h1>
            <p className={styles.heroSubtitle}>
              Give your child the gift of adventure! Our electric balance bikes are engineered for safety, built for fun, and designed to create lifelong memories.
            </p>
          </div>
          <div className={styles.heroImageContainer}>
              <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/09/Gobike-kids-electric-bike-ebike-for-kids-scaled.webp"
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
          <PaginationControls pageInfo={pageInfo} basePath="/bikes" />
        </main>

        <section className={styles.whyChooseUs}>
          <div className={styles.whyChooseUsImage}>
               <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-4-scaled-1.webp"
                  alt="GoBike parts and features"
                  width={500}
                  height={500}
                  className={styles.sectionImage}
              />
          </div>
          <div className={styles.whyChooseUsContent}>
              <h2>Engineered for Safety, Built for Fun.</h2>
              <p>Every GoBike is more than just a toy. It is a premium-quality ride designed with your childs safety as our number one priority.</p>
              <ul>
                  <li><strong>Lightweight & Durable Frame:</strong> Easy for kids to handle, tough enough for any adventure.</li>
                  <li><strong>Safe Speed Modes:</strong> Start with a slow learning mode and unlock faster speeds as they grow in confidence.</li>
                  <li><strong>Reliable Braking System:</strong> Powerful disc brakes for safe and immediate stopping power.</li>
                  <li><strong>Long-Lasting Battery:</strong> More ride time, less charge time. The fun never has to stop!</li>
              </ul>
               <Link href="/about" className={styles.secondaryButton}>Learn Our Story</Link>
          </div>
        </section>

        <section className={styles.seoBottomSection}>
          <h2>Your Journey to Adventure Starts Here</h2>
          <p>
            At GoBike, we believe in the power of outdoor play. Our electric bikes are the perfect tool to get your kids off screens and into the great outdoors, building confidence and coordination along the way. We are a proud Aussie brand, committed to providing the best quality and service.
          </p>
          <div className={styles.internalLinks}>
            <Link href="/spare-parts" className={styles.internalLink}>Shop All Spare Parts</Link>
            <Link href="/contact" className={styles.internalLink}>Contact Our Team</Link>
            <Link href="/faq" className={styles.internalLink}>Find Answers (FAQ)</Link>
          </div>
        </section>
      </div>
    </div>
  );
}