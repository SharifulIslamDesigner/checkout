'use client';

import { useState,useRef, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './filters.module.css';
import { IoChevronDown } from 'react-icons/io5';

interface Category {
  id: string;
  name: string;
  slug: string;
}
interface ProductFiltersProps {
  categories: Category[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeCategorySlug = searchParams.get('category') || 'all';
  const activeCategory = categories.find(c => c.slug === activeCategorySlug) || { name: 'All Products' };

  // --- ড্রপডাউনের বাইরে ক্লিক করলে সেটি বন্ধ করার জন্য ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    params.delete('after');
    params.delete('before');
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false); // একটি আইটেম সিলেক্ট করার পর ড্রপডাউন বন্ধ করে দিন
  };

  return (
    <div className={styles.filterBar}>
        <div className={styles.dropdownWrapper} ref={wrapperRef}>
            <button className={styles.dropdownButton} onClick={() => setIsOpen(!isOpen)}>
                <span>{activeCategory.name}</span>
                <IoChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
            
            {isOpen && (
                <ul className={styles.dropdownMenu}>
                    <li onClick={() => handleCategoryChange('all')}>All Products</li>
                    {categories.map((category) => (
                        <li key={category.id} onClick={() => handleCategoryChange(category.slug)}>
                            {category.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
  );
}