// app/bikes/page.tsx

import { gql } from '@apollo/client';
import Link from 'next/link';
import client from '../../lib/apolloClient';
import styles from './BikesPage.module.css'; // নিশ্চিত করুন এই CSS ফাইলটি আছে
import ProductCard from '../products/ProductCard';
import PaginationControls from '../products/PaginationControls';

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
              ... on SimpleProduct { price(format: FORMATTED) }
              ... on VariableProduct { price(format: FORMATTED) }
            }
            pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
          }
        }
      `,
      variables: { first, after, last, before },
      context: { fetchOptions: { next: { revalidate: 0 } } },
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
        <h1>Australia's Top-Rated Electric Bikes for Kids</h1>
        <p>
          Discover the perfect ride to kickstart your child&apos;s adventure. Our electric bikes are designed for safety, durability, and maximum fun, making them the #1 choice for families across Australia.
        </p>
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
      <section className={styles.seoBottomSection}>
        <h2>Built for Adventure, Backed by Quality</h2>
        <p>
          Each bike in our collection passes rigorous safety checks and is built with high-quality components to handle any adventure. From the first wobbly ride to confident cruising, we&apos;re here to support your journey.
        </p>
        <div className={styles.internalLinks}>
          <Link href="/products" className={styles.internalLink}>Shop All Products</Link>
          <Link href="/about" className={styles.internalLink}>Learn Our Story</Link>
          <Link href="/faq" className={styles.internalLink}>Find Answers (FAQ)</Link>
        </div>
      </section>
    </div>
  );
}