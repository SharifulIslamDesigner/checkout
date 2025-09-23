import { gql } from '@apollo/client';
import { notFound } from 'next/navigation';
import type { Metadata} from 'next';

// --- সমাধান: সঠিক ফাইল থেকে getClient import করা হচ্ছে ---
import { getClient } from '../../../lib/apollo-rsc-client';

import ProductClient from './ProductClient'; 
import Breadcrumbs from '../../../components/Breadcrumbs';

// --- Interfaces (আপডেট করা হয়েছে) ---
interface ReviewEdge {
  rating: number;
  node: { id: string; author: { node: { name: string; }; }; content: string; date: string; };
}

interface Product {
  id: string; 
  databaseId: number; 
  slug: string; 
  name: string; 
  description: string; 
  shortDescription?: string;
  image?: { sourceUrl: string }; 
  galleryImages: { nodes: { sourceUrl: string }[] };
  price?: string; 
  salePrice?: string; 
  regularPrice?: string; 
  sku?: string; 
  stockStatus?: string;
  onSale: boolean; // <-- সমাধান: এই লাইনটি যোগ করা হয়েছে
  attributes: { nodes: { name: string, options: string[] }[] };
  averageRating: number; 
  reviewCount: number; 
  reviews: { edges: ReviewEdge[]; };
  related: { 
    nodes: { 
      id: string; 
      databaseId: number; 
      name: string; 
      slug: string; 
      image?: { sourceUrl: string };
      price?: string; 
      salePrice?: string; 
      regularPrice?: string; 
      onSale: boolean; 
    }[]; 
  };
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}
interface QueryData { product: Product | null; }

// --- GraphQL Query (অপরিবর্তিত) ---
const GET_PRODUCT_QUERY = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      id
      databaseId
      slug
      name
      description
      shortDescription
      image { sourceUrl }
      galleryImages { nodes { sourceUrl } }
      ... on SimpleProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) onSale sku stockStatus attributes { nodes { name options } } weight length width height }
      ... on VariableProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) onSale sku stockStatus attributes { nodes { name options } } weight length width height }
      averageRating
      reviewCount
      reviews(first: 100) { edges { rating node { id author { node { name } } content date } } }
      related(first: 4) {
        nodes {
          id
          databaseId
          name
          slug
          image { sourceUrl }
          onSale
          averageRating
          reviewCount
          ... on SimpleProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) }
          ... on VariableProduct { price(format: FORMATTED) regularPrice(format: FORMATTED) salePrice(format: FORMATTED) }
        }
      }
    }
  }
`;

// --- Data Fetching Function ---
async function getProductData(slug: string): Promise<Product | null> {
    try {
        const { data } = await getClient().query<QueryData>({ 
            query: GET_PRODUCT_QUERY, 
            variables: { slug }, 
            context: { fetchOptions: { next: { revalidate: 50000 } } } // 1 hour cache
        });
        
        if (!data || !data.product) {
            console.error("Product data not found in GraphQL response for slug:", slug);
            return null;
        }

        return data.product;
    } catch (error) {
        console.error("Failed to fetch product on server:", error);
        return null;
    }
}

// --- SEO: Metadata Function ---
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product) { return { title: 'Product Not Found' }; }

  const descriptionSource = product.shortDescription || product.description || '';
  const plainDescription = descriptionSource.replace(/<[^>]*>?/gm, '');
  const imageUrl = product.image?.sourceUrl || '/og-image.png';

  return {
    title: product.name,
    description: plainDescription.substring(0, 155),
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.name,
      description: plainDescription.substring(0, 155),
      images: [{ url: imageUrl, width: 800, height: 800, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: plainDescription.substring(0, 155),
      images: [imageUrl],
    },
  };
}

// --- Page Component ---
export default async function SingleProductPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await getProductData(slug);
  
  if (!product) { notFound(); }

  const getPriceAsNumber = (priceString: string | undefined | null): number | undefined => {
    if (!priceString) return undefined;
    return parseFloat(priceString.replace(/[^0-9.]/g, ''));
  };

  const schemaDescriptionSource = product.shortDescription || product.description || '';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: schemaDescriptionSource.replace(/<[^>]*>?/gm, '').substring(0, 5000),
    image: product.image?.sourceUrl,
    sku: product.sku || product.databaseId.toString(),
    brand: { '@type': 'Brand', name: 'GoBike' },
    offers: {
      '@type': 'Offer',
      url: `https://gobike.au/product/${product.slug || slug}`,
      priceCurrency: 'AUD',
      price: getPriceAsNumber(product.salePrice) || getPriceAsNumber(product.regularPrice),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stockStatus === 'IN_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
    } : undefined,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Breadcrumbs pageTitle={product.name} />
      <ProductClient product={product} />
    </div>
  );
}