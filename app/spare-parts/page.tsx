import { gql } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getClient } from '../../lib/apollo-rsc-client';
import styles from './SparePartsPage.module.css';
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
  const title = "Genuine Spare Parts & Accessories";
  const description = "Keep the adventure going! Find all genuine GoBike replacement parts, from batteries and chargers to wheels and grips, to maintain and customize your kids electric bike.";
  
  return {
    title,
    description,
    alternates: {
      canonical: '/spare-parts',
    },
    openGraph: {
      title,
      description,
      url: '/spare-parts',
    }
  };
}

// --- Data Fetching Function ---
async function getSpareParts(
    first: number | null,
    after: string | null,
    last: number | null,
    before: string | null
) {
  try {
    // --- সমাধান: getClient() এখন সঠিকভাবে কাজ করবে ---
    const { data } = await getClient().query<QueryData>({
      query: gql`
        query GetSparePartsCursor($first: Int, $after: String, $last: Int, $before: String) {
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
    console.error("Error in getSpareParts:", error);
    return {
      products: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }
}

// --- Page Component ---
export default async function SparePartsPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
   const resolvedSearchParams = await searchParams;
  const after = typeof resolvedSearchParams.after === 'string' ? resolvedSearchParams.after : null;
  const before = typeof resolvedSearchParams.before === 'string' ? resolvedSearchParams.before : null;

  const { products, pageInfo } = await getSpareParts(
    before ? null : PRODUCTS_PER_PAGE,
    after,
    before ? PRODUCTS_PER_PAGE : null,
    before
  );

  return (
    <div>
      <Breadcrumbs pageTitle="Spare Parts" />
      <div className={styles.pageContainer}>
        
        <header className={styles.header}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Genuine GoBike Spare Parts & Accessories</h1>
            <p className={styles.heroSubtitle}>
              Keep the adventure going! Find all the genuine replacement parts and cool accessories you need to maintain and customize your GoBike.
            </p>
          </div>
          <div className={styles.heroImageContainer}>
              <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/02/Electric-Balance-Bike-Electric-bike-Balance-Bike-scaled-1.webp"
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
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p>No spare parts found.</p>
          )}
          <PaginationControls pageInfo={pageInfo} basePath="/spare-parts" />
        </main>

        <section className={styles.whyChooseUs}>
          <div className={styles.whyChooseUsImage}>
               <Image 
                  src="https://gobikes.au/wp-content/uploads/2025/08/Gobike-kids-electric-bike-ebike-for-kids-1-scaled-1.webp"
                  alt="GoBike genuine parts quality"
                  width={500}
                  height={500}
                  className={styles.sectionImage}
              />
          </div>
          <div className={styles.whyChooseUsContent}>
              <h2>Why Choose Genuine GoBike Parts?</h2>
              <p>Do nott settle for less. Our genuine spare parts are manufactured to the same high standards as our bikes, ensuring perfect fit, maximum safety, and peak performance.</p>
              <ul>
                  <li><strong>Perfect Fit Guarantee:</strong> Designed specifically for your GoBike model.</li>
                  <li><strong>Uncompromised Safety:</strong> Built with the same quality materials for total peace of mind.</li>
                  <li><strong>Peak Performance:</strong> Restore your bike to its original performance and glory.</li>
                  <li><strong>Easy Installation:</strong> Get back to riding faster with parts that are easy to install.</li>
              </ul>
               <Link href="/bikes" className={styles.secondaryButton}>Shop All Bikes</Link>
          </div>
        </section>

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
    </div>
  );
}