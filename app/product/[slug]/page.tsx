// app/product/[slug]/page.tsx
// এটি এখন একটি সার্ভার কম্পוננט

import { gql } from '@apollo/client';
import client from '../../../lib/apolloClient';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient'; 

// --- TypeScript Interfaces (সার্ভারের জন্য) ---
// ইন্টারফেসটি আপডেট করা হয়েছে যাতে নতুন ডেটা স্ট্রাকচার অন্তর্ভুক্ত থাকে
interface ReviewEdge {
  rating: number;
  node: {
    id: string;
    author: { node: { name: string; }; };
    content: string;
    date: string;
  };
}

interface Product {
  id: string;
  databaseId: number;
  name: string;
  description: string;
  shortDescription?: string;
  image?: { sourceUrl: string };
  galleryImages: { nodes: { sourceUrl: string }[] };
  price?: string;
  attributes: { nodes: { name: string, options: string[] }[] };
  averageRating: number;
  reviewCount: number;
  reviews: {
    edges: ReviewEdge[];
  };
  related: { 
    nodes: {
      id: string;
      databaseId: number;
      name: string;
      slug: string;
      image?: { sourceUrl: string };
      price?: string;
    }[]; 
  };
}

interface QueryData { product: Product | null; }

// GraphQL কোয়েরিটি নতুন স্কিমা অনুযায়ী আপডেট করা হয়েছে
const GET_PRODUCT_QUERY = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      description
      shortDescription
      image { sourceUrl }
      galleryImages { nodes { sourceUrl } }
      ... on SimpleProduct {
        price(format: FORMATTED)
        attributes { nodes { name options } }
        weight
        length
        width
        height
      }
      ... on VariableProduct {
        price(format: FORMATTED)
        attributes { nodes { name options } }
        weight
        length
        width
        height
      }
      averageRating
      reviewCount
      reviews(first: 100) {
        edges {
          rating
          node {
            id
            author { node { name } }
            content
            date
          }
        }
      }
      related(first: 4) {
        nodes {
          id
          databaseId
          name
          slug
          image { sourceUrl }
          ... on SimpleProduct { price(format: FORMATTED) }
          ... on VariableProduct { price(format: FORMATTED) }
        }
      }
    }
  }
`;

// getProductData ফাংশনটি অপরিবর্তিত
async function getProductData(slug: string) {
    try {
        const { data } = await client.query<QueryData>({
            query: GET_PRODUCT_QUERY,
            variables: { slug: slug },
            context: {
                fetchOptions: {
                    next: { revalidate: 3600 },
                },
            },
        });
        return data.product;
    } catch (error) {
        console.error("Failed to fetch product on server:", error);
        return null;
    }
}

// SingleProductPage কম্পোনেন্টটি অপরিবর্তিত
export default async function SingleProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductData(params.slug);

  if (!product) {
    notFound();
  }
  return <ProductClient product={product} />;
}