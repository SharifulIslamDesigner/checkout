'use client'; // <-- কার্যকরী সমাধান: এটিকে একটি ক্লায়েন্ট কম্পোনেন্ট বানানো হয়েছে

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient';
import ProductCard from '../app/products/ProductCard';
import styles from './CartCrossSell.module.css';

// --- টাইপ ইন্টারফেস (অপরিবর্তিত) ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
  averageRating?: number;
  reviewCount?: number;
  onSale: boolean;
  regularPrice?: string;
  salePrice?: string;
}
interface QueryData {
  products: {
    nodes: Product[];
  } | null;
}
// --- GraphQL কোয়েরি (অপরিবর্তিত) ---
const GET_CROSS_SELL_PRODUCTS_QUERY = gql`
  query GetCrossSellProducts {
    products(where: { categoryIn: ["spare-parts"] }, first: 4) {
      nodes {
        id
        databaseId
        name
        slug
        image { sourceUrl }
        onSale
        ... on SimpleProduct { price(format: FORMATTED), regularPrice(format: FORMATTED), salePrice(format: FORMATTED) }
        ... on VariableProduct { price(format: FORMATTED), regularPrice(format: FORMATTED), salePrice(format: FORMATTED) }
        averageRating
        reviewCount
      }
    }
  }
`;

// --- মূল কম্পোনেন্ট (এখন এটি ক্লায়েন্ট কম্পোনেন্ট) ---
export default function CartCrossSell() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // --- কার্যকরী সমাধান: ডেটা এখন useEffect ব্যবহার করে ক্লায়েন্টে আনা হচ্ছে ---
  useEffect(() => {
    async function getCrossSellProducts() {
      try {
        const { data } = await client.query<QueryData>({
          query: GET_CROSS_SELL_PRODUCTS_QUERY,
        });
        setProducts(data?.products?.nodes || []);
      } catch (error) {
        console.error("Error fetching cross-sell products:", error);
      } finally {
        setLoading(false);
      }
    }
    getCrossSellProducts();
  }, []); // <-- খালি dependency array নিশ্চিত করে যে এটি শুধু একবারই রান করবে

  if (loading) {
    return (
        <section className={styles.crossSellSection}>
            <h2 className={styles.sectionTitle}>You Might Also Like</h2>
            <p style={{textAlign: 'center'}}>Loading products...</p>
        </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.crossSellSection}>
      <h2 className={styles.sectionTitle}>You Might Also Like</h2>
      <div className={styles.productsGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}