// app/products/page.tsx

import { gql } from '@apollo/client';
import client from '../../lib/apolloClient';
import styles from './products.module.css';
import ProductFilters from './ProductFilters';
import PaginationControls from './PaginationControls';
import ProductsGrid from './ProductsGrid'; // <-- নতুন ক্লায়েন্ট গ্রিড ইম্পোর্ট করা হচ্ছে

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
interface Category {
  id: string;
  name: string;
  slug: string;
}
interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

// --- ফাংশনটি এখন চূড়ান্তভাবে সঠিক ---
async function getProductsAndCategories(
    category: string | null,
    first: number | null,
    after: string | null,
    last: number | null,
    before: string | null
) {
  try {
    const { data } = await client.query({
      query: gql`
        query GetProductsCursor($category: String, $first: Int, $after: String, $last: Int, $before: String) {
          products(where: { category: $category }, first: $first, after: $after, last: $last, before: $before) {
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
          productCategories(first: 100) { nodes { id, name, slug } }
        }
      `,
      variables: { category, first, after, last, before },
      context: { fetchOptions: { next: { revalidate: 86400 } } },
    });
    return {
        products: data.products?.nodes || [],
        categories: data.productCategories?.nodes || [],
        pageInfo: data.products?.pageInfo || { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  } catch (error) {
    console.error("Error fetching products/categories:", error);
    return {
        products: [], categories: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }
}

export default async function ProductsPage({ searchParams }: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const category = typeof searchParams.category === 'string' ? searchParams.category : null;
  const after = typeof searchParams.after === 'string' ? searchParams.after : null;
  const before = typeof searchParams.before === 'string' ? searchParams.before : null;

  const { products, categories, pageInfo } = await getProductsAndCategories(
    category,
    before ? null : PRODUCTS_PER_PAGE,
    after,
    before ? PRODUCTS_PER_PAGE : null,
    before
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1>Our Exclusive Collection</h1>
        <p>Explore our curated selection of high-quality products. Find exactly what you are looking for.</p>
      </header>
      <main className={styles.mainContent}>
        <aside className={styles.filtersContainer}>
          <ProductFilters categories={categories} />
        </aside>
        <div className={styles.productsGridContainer}>
          {/* --- মূল সমাধান: সার্ভার থেকে ক্লায়েন্ট কম্পוננטকে ডেটা পাস করা হচ্ছে --- */}
          <ProductsGrid products={products} />
          <PaginationControls pageInfo={pageInfo} />
        </div>
      </main>
    </div>
  );
}