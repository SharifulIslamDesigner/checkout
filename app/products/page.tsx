import { gql } from '@apollo/client';
import type { Metadata } from 'next';

// --- সমাধান: সঠিক ফাইল থেকে getClient import করা হচ্ছে ---
import { getClient } from '../../lib/apollo-rsc-client';

import styles from './products.module.css';
import ProductFilters from './ProductFilters';
import PaginationControls from './PaginationControls';
import ProductsGrid from './ProductsGrid';
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
interface QueryData {
  products: {
    nodes: Product[];
    pageInfo: PageInfo;
  } | null;
  productCategories: {
    nodes: Category[];
  } | null;
}
// --- SEO: Dynamic Metadata Function ---
export async function generateMetadata({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const categorySlug = resolvedSearchParams.category as string | undefined;

  let title = "Shop All Products | GoBike Australia";
  let description = "Explore our curated selection of high-quality bikes, spare parts, and accessories. Find exactly what you are looking for at GoBike.";
  let canonicalUrl = '/products';

  if (categorySlug) {
    // এখানে ক্যাটাগরির আসল নাম ডেটাবেস থেকে আনা যেতে পারে, তবে আপাতত slug দিয়েই কাজ চালানো হচ্ছে
    const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    title = `Shop ${categoryName} | GoBike Australia`;
    description = `Discover our collection of ${categoryName}. Top quality and performance guaranteed. Shop now at GoBike Australia.`;
    canonicalUrl = `/products?category=${categorySlug}`;
  }
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    }
  };
}

// --- Data Fetching Function ---
async function getProductsAndCategories(
    category: string | null,
    first: number | null,
    after: string | null,
    last: number | null,
    before: string | null
) {
  try {
    // --- সমাধান: getClient() এখন সঠিকভাবে কাজ করবে ---
    const { data } = await getClient().query<QueryData>({
      query: gql`
        query GetProductsCursor($category: String, $first: Int, $after: String, $last: Int, $before: String) {
          products(where: { category: $category }, first: $first, after: $after, last: $last, before: $before) {
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
          productCategories(first: 100) { nodes { id, name, slug } }
        }
      `,
      variables: { category, first, after, last, before },
      context: { fetchOptions: { next: { revalidate: 50000 } } }, // 1 hour cache
    });
    if (!data) {
        // যদি data না থাকে, তাহলে একটি খালি ফলাফল রিটার্ন করুন
        console.error("No data returned from GraphQL query.");
        return {
            products: [],
            categories: [],
            pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
        };
    }
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

// --- Page Component ---
export default async function ProductsPage({ searchParams }: {
  searchParams: { [key:string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = await searchParams;
  const category = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : null;
  const after = typeof resolvedSearchParams.after === 'string' ? resolvedSearchParams.after : null;
  const before = typeof resolvedSearchParams.before === 'string' ? resolvedSearchParams.before : null;

  const { products, categories, pageInfo } = await getProductsAndCategories(
    category,
    before ? null : PRODUCTS_PER_PAGE,
    after,
    before ? PRODUCTS_PER_PAGE : null,
    before
  );

  const currentCategoryName = categories.find((c: Category) => c.slug === category)?.name || "All Products";

  return (
    <div>
      <Breadcrumbs pageTitle={currentCategoryName} />
      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <h1>{currentCategoryName}</h1>
          <p>Explore our curated selection of high-quality products. Find exactly what you are looking for.</p>
        </header>
        
        <ProductFilters categories={categories} />
        
        <main className={styles.mainContent}>
          {products.length > 0 ? (
            <ProductsGrid products={products} />
          ) : (
            <p className={styles.noProductsFound}>No products found in this category.</p>
          )}
        </main>
        
        <div className={styles.paginationWrapper}>
            <PaginationControls pageInfo={pageInfo} basePath="/products" />
        </div>
      </div>
    </div>
  );
}