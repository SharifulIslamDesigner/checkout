// app/product/[slug]/page.tsx
// এটি এখন একটি সার্ভার কম্পוננט

import { gql } from '@apollo/client';
import client from '../../../lib/apolloClient';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient'; 

// --- TypeScript Interfaces (সার্ভারের জন্য) ---
interface Product {
  id: string;
  databaseId: number;
  name: string;
  // ... (বাকি সব টাইপ এখানে প্রয়োজন অনুযায়ী যোগ করুন)
}
interface QueryData { product: Product | null; }

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
      }
      ... on VariableProduct {
        price(format: FORMATTED)
        attributes { nodes { name options } }
      }
      reviews(first: 50) {
        nodes {
          id
          author { node { name } }
          content
          date
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
async function getProductData(slug: string) {
    try {
        const { data } = await client.query<QueryData>({
            query: GET_PRODUCT_QUERY,
            variables: { slug: slug },
            context: {
                fetchOptions: {
                    next: { revalidate: 3600 }, // ১ ঘণ্টার জন্য ক্যাশ করা হচ্ছে (ঐচ্ছিক)
                },
            },
        });
        return data.product;
    } catch (error) {
        console.error("Failed to fetch product on server:", error);
        return null;
    }
}


export default async function SingleProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductData(params.slug);

  if (!product) {
    notFound();
  }
  return <ProductClient product={product} />;
}