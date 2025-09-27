// app/sitemap.js

import { gql } from '@apollo/client';
import fs from 'fs';
import path from 'path';
import { getClient } from '../lib/apollo-rsc-client';

const URL = 'https://gobike.au';

// --- ১. GraphQL কোয়েরি (সবচেয়ে নিরাপদ এবং সুনির্দিষ্ট ভার্সন) ---
const GET_ALL_PRODUCTS_FOR_SITEMAP = gql`
  query GetAllProductsForSitemap {
    products(first: 10000) {
      nodes {
        slug
        # --- সমাধান: প্রতিটি সম্ভাব্য প্রোডাক্ট টাইপের জন্য আলাদা করে ডেট ফিল্ড আনা হচ্ছে ---
        ... on SimpleProduct {
          date
          modified
        }
        ... on VariableProduct {
          date
          modified
        }
        ... on ExternalProduct {
          date
          modified
        }
        ... on GroupProduct {
          date
          modified
        }
      }
    }
  }
`;

// --- ২. সব ব্লগ পোস্টের slug পড়ার ফাংশন ---
function getAllBlogPosts() {
  try {
    const blogDir = 'blogs';
    const files = fs.readdirSync(path.join(process.cwd(), blogDir));
    
    return files.map(filename => {
      const slug = filename.replace(/\.md$/, '');
      const filePath = path.join(process.cwd(), blogDir, filename);
      const stats = fs.statSync(filePath);
      
      return { slug, lastModified: stats.mtime };
    });
  } catch (error) {
    console.error("Sitemap: Could not read blog files.", error);
    return []; // ব্লগ খুঁজে না পেলে খালি অ্যারে রিটার্ন করবে
  }
}

export default async function sitemap() {
  const staticRoutes = [
    { url: `${URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${URL}/bikes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${URL}/refund-and-returns-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${URL}/spare-parts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productRoutes = [];
  try {
    const { data } = await getClient().query({
      query: GET_ALL_PRODUCTS_FOR_SITEMAP,
      context: { fetchOptions: { next: { revalidate: 3600 } } }
    });

    if (data && data.products && data.products.nodes) {
      productRoutes = data.products.nodes
        .filter(product => product.slug) // শুধু slug আছে এমন প্রোডাক্ট নেওয়া হচ্ছে
        .map(product => {
          // --- নিরাপদ ডেট হ্যান্ডলিং ---
          const lastModifiedDate = product.modified || product.date || new Date();
          return {
            url: `${URL}/product/${product.slug}`,
            lastModified: new Date(lastModifiedDate),
            changeFrequency: 'weekly',
            priority: 0.9,
          };
      });
    }
  } catch (error) {
    console.error("Sitemap: Error fetching product data from GraphQL.", error);
    // প্রোডাক্ট ফেচ করতে ব্যর্থ হলে সমস্যা নেই, সাইটম্যাপ শুধু বাকি পেজগুলো দেখাবে
  }

  const blogRoutes = getAllBlogPosts().map(post => ({
    url: `${URL}/blog/${post.slug}`,
    lastModified: post.lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}