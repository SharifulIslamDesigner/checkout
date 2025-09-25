import { MetadataRoute } from 'next';
import { getClient } from '../lib/apollo-rsc-client';
import { gql } from '@apollo/client';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// --- আপনার ফাইনাল ডোমেইন ---
const SITE_URL = 'https://sharifulbuilds.com';

// --- টাইপ ডেফিনিশন ---
interface ContentNode {
  slug: string;
  modifiedGmt: string | null; // <-- null হতে পারে
}
interface QueryData {
  products: { nodes: ContentNode[] } | null;
  posts: { nodes: ContentNode[] } | null;
}

// --- সব প্রোডাক্ট এবং পোস্টের slug আনার জন্য GraphQL কোয়েরি ---
const GET_ALL_SLUGS_QUERY = gql`
  query GetAllSlugs {
    products(first: 10000) {
      nodes {
        slug
        ... on ContentNode {
          modifiedGmt
        }
      }
    }
    posts(first: 10000) {
      nodes {
        slug
        ... on ContentNode {
          modifiedGmt
        }
      }
    }
  }
`;

/**
 * একটি তারিখের স্ট্রিংকে নিরাপদে ISO ফরম্যাটে রূপান্তর করে।
 * যদি তারিখটি ভুল বা খালি থাকে, তাহলে বর্তমান তারিখ ব্যবহার করে।
 * @param dateString - তারিখের স্ট্রিং
 * @returns ISO ফরম্যাটের তারিখ
 */
const getSafeLastModified = (dateString: string | null | undefined): string => {
  if (dateString) {
    const date = new Date(dateString);
    // তারিখটি বৈধ কিনা তা পরীক্ষা করা হচ্ছে
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  // যদি তারিখ ভুল বা খালি থাকে, তাহলে বর্তমান তারিখ ব্যবহার করা হবে
  return new Date().toISOString();
};


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  // --- ১. স্ট্যাটিক পেজগুলোর তালিকা ---
  const staticRoutes = [
    '/', '/bikes', '/spare-parts', '/products', 
    '/about', '/contact', '/faq', '/blog',
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));

  // --- ২. WordPress থেকে ডাইনামিক URL আনা হচ্ছে ---
  const client = getClient();
  const { data } = await client.query<QueryData>({
    query: GET_ALL_SLUGS_QUERY,
  });

  // --- ৩. প্রোডাক্ট পেজগুলোর তালিকা ---
  const productRoutes = data?.products?.nodes?.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: getSafeLastModified(product.modifiedGmt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  })) || [];


  // --- ৪. লোকাল ফোল্ডার থেকে ব্লগ পোস্টের URL আনা হচ্ছে ---
  const postsDirectory = path.join(process.cwd(), 'blogs');
  let blogPostRoutes: MetadataRoute.Sitemap = [];
  try {
    const filenames = fs.readdirSync(postsDirectory);
    blogPostRoutes = filenames
      .filter(filename => filename.endsWith('.md') || filename.endsWith('.mdx'))
      .map((filename) => {
        const filePath = path.join(postsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter } = matter(fileContents);
        
        return {
          url: `${SITE_URL}/blog/${filename.replace(/\.mdx?$/, '')}`,
          lastModified: getSafeLastModified(frontmatter.date),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
    });
  } catch (error) {
      console.error("Could not read blog posts for sitemap:", error);
      // যদি blogs ফোল্ডার খুঁজে না পাওয়া যায়, তাহলে বিল্ড যেন ব্যর্থ না হয়
  }

  // --- সব তালিকা একত্রিত করে রিটার্ন করা হচ্ছে ---
  return [...staticRoutes, ...productRoutes, ...blogPostRoutes];
}