// app/products/ProductsGrid.tsx
'use client'; // <-- এই লাইনটি অপরিহার্য

import ProductCard from './ProductCard';
import styles from './products.module.css';

// সার্ভার কম্পוננט থেকে আসা প্রোডাক্ট ডেটার ধরন
interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  image?: { sourceUrl: string };
  price?: string;
}

// ProductsGrid কম্পוננטের props-এর ধরন
interface ProductsGridProps {
    products: Product[];
}

export default function ProductsGrid({ products }: ProductsGridProps) {
    if (!products || products.length === 0) {
        return <p>No products found for this category.</p>;
    }

    return (
        <div className={styles.grid}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}