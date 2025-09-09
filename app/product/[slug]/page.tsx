'use client';

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import client from '../../../lib/apolloClient';
import styles from './ProductPage.module.css';
import { notFound } from 'next/navigation';

// --- এই ফাইলগুলোর পাথ আপনার প্রজেক্ট অনুযায়ী সঠিক কিনা তা নিশ্চিত করুন ---
import QuantityAddToCart from '../../../components/QuantityAddToCart';
import ReviewForm from '../../../components/ReviewForm';
import ProductCard from '../../products/ProductCard';


// --- TypeScript Interfaces ---
interface ImageNode { sourceUrl: string; }
interface Attribute { name: string; options: string[]; }
interface Review {
  id: string;
  author: { node: { name: string; }; };
  content: string;
  date: string;
}
interface RelatedProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: ImageNode;
  price?: string;
}
interface Product {
  id: string;
  databaseId: number;
  name: string;
  description: string;
  shortDescription?: string;
  image?: ImageNode;
  galleryImages: { nodes: ImageNode[]; };
  price?: string;
  attributes: { nodes: Attribute[]; };
  reviews: { nodes: Review[]; };
  related: { nodes: RelatedProduct[]; };
}

// --- নতুন এবং সঠিক GraphQL কোয়েরি ---
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
      reviews(first: 10) {
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

export default function SingleProductPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const { data } = await client.query({
          query: GET_PRODUCT_QUERY,
          variables: { slug: params.slug },
          fetchPolicy: 'no-cache', // ক্যাশ নিষ্ক্রিয় করা
        });
        if (data && data.product) {
          setProduct(data.product);
          setMainImage(data.product.image?.sourceUrl);
        } else {
          notFound();
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [params.slug]);
  
  if (loading) return <div>Loading...</div>;
  if (!product) return null;

  // QuantityAddToCart-কে পাস করার জন্য অবজেক্ট
  const productForCart = {
    id: product.id,
    databaseId: product.databaseId,
    name: product.name,
    price: product.price,
    image: product.image?.sourceUrl,
  };

  const allImages = [product.image, ...product.galleryImages.nodes].filter(Boolean) as ImageNode[];

  return (
    <div className={styles.container}>
      <div className={styles.productLayout}>
        <div className={styles.galleryContainer}>
            {mainImage && <img src={mainImage} alt={product.name} className={styles.mainImage} />}
            {allImages.length > 1 && (
                <div className={styles.thumbnailGrid}>
                {allImages.map((img, index) => (
                    <img key={index} src={img.sourceUrl} alt={`${product.name} thumbnail ${index + 1}`}
                    className={`${styles.thumbnail} ${mainImage === img.sourceUrl ? styles.activeThumbnail : ''}`}
                    onClick={() => setMainImage(img.sourceUrl)} />
                ))}
                </div>
            )}
        </div>

        <div>
          <h1 className={styles.productTitle}>{product.name}</h1>
          <div className={styles.ratingWrapper}>
            <div className={styles.rating}>★★★★☆</div>
            <div className={styles.reviewsCount}>(8 customer reviews)</div>
          </div>
          <div className={styles.priceWrapper}>
            <img src="https://gobike.au/wp-content/uploads/2025/08/hot-deal.svg" alt="Hot Deal" className={styles.dealBadge} />
            {product.price && (
              <div className={styles.productPrice} dangerouslySetInnerHTML={{ __html: product.price }} />
            )}
          </div>
          {product.shortDescription && (
            <div 
              className={styles.shortDescription} 
              dangerouslySetInnerHTML={{ __html: product.shortDescription.replace(/<ul>/g, `<ul class="${styles.featuresGrid}">`).replace(/<li>/g, `<li class="${styles.featureItem}">`) }} 
            />
          )}
          <QuantityAddToCart product={productForCart} />
          <div className={styles.trustBadges}>
            <span>✓ 100% Secure Checkout</span>
            <span>✓ 30 Days Easy Returns</span>
            <span>✓ 1 Year Full Warranty</span>
            <span>✓ Fast Shipping Aus-Wide</span>
          </div>
          <div className={styles.checkoutGuarantee}>
            <p className={styles.guaranteeText}>Guaranteed Safe Checkout</p>
            <img src="https://themedemo.commercegurus.com/shoptimizer-demodata/wp-content/uploads/sites/53/2018/07/trust-symbols_a.jpg" alt="Payment Methods" className={styles.paymentLogos} />
          </div>
        </div>
      </div>
      
      {product.description && (
        <section className={styles.productInfoSection}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <div className={styles.sectionContent} dangerouslySetInnerHTML={{ __html: product.description }} />
        </section>
      )}

      {product.attributes && product.attributes.nodes.length > 0 && (
        <section className={styles.productInfoSection}>
          <h2 className={styles.sectionTitle}>Additional Information</h2>
          <div className={styles.sectionContent}>
            <table>
              <tbody>
                {product.attributes.nodes.map((attr, index) => (
                  <tr key={index}>
                    <th>{attr.name}</th>
                    <td>{attr.options.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      <section className={styles.productInfoSection}>
        <h2 className={styles.sectionTitle}>Customer Reviews</h2>
        <div className={styles.sectionContent}>
          {product.reviews && product.reviews.nodes.length > 0 ? (
            product.reviews.nodes.map(review => (
              <div key={review.id}>
                <strong>{review.author.node.name}</strong>
                <p>{new Date(review.date).toLocaleDateString()}</p>
                <div dangerouslySetInnerHTML={{ __html: review.content }} />
              </div>
            ))
          ) : (
            <p>There are no reviews yet.</p>
          )}
          <ReviewForm productId={product.databaseId} />
        </div>
      </section>

      {product.related && product.related.nodes.length > 0 && (
        <div className={styles.relatedProducts}>
          <h2 className={styles.relatedTitle}>Related Products</h2>
          <div className={styles.relatedGrid}>
            {product.related.nodes.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}