'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { useCart } from '../context/CartContext';
import SearchOverlay from './SearchOverlay';
import MiniCart from './MiniCart';
import Image from 'next/image';

import { IoSearch, IoPersonOutline, IoMenu, IoClose } from "react-icons/io5";

export default function Header() {
  const { cartItems, isMiniCartOpen, openMiniCart, closeMiniCart } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const closeAllOverlays = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          
          {/* --- বাম অংশ: ডেস্কটপে লোগো, মোবাইলে হ্যামবার্গার --- */}
          <div className={styles.leftSection}>
            <button onClick={() => setIsMenuOpen(true)} className={`${styles.iconButton} ${styles.hamburger}`}>
                <IoMenu size={28} />
            </button>
            <div className={`${styles.logo} ${styles.desktopOnly}`}>
              <Link href="/">
                 <Image src="https://gobike.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp" alt="GoBike Logo" width={1880} height={410} priority className={styles.logoImage} />
              </Link>
            </div>
          </div>

          {/* --- মধ্যম অংশ: মোবাইলে লোগো, ডেস্কটপে নেভিগেশন --- */}
          <div className={`${styles.logo} ${styles.mobileOnly}`}>
            <Link href="/">
               <Image src="https://gobike.au/wp-content/uploads/2025/06/cropped-GOBIKE-Electric-Bike-for-kids-1.webp" alt="GoBike Logo" width={1880} height={410} priority className={styles.logoImage} />
            </Link>
          </div>
          <nav className={styles.desktopNavigation}>
            <Link href="/" className={pathname === '/' ? styles.activeLink : ''}>Home</Link>
            <Link href="/bikes" className={pathname === '/bikes' ? styles.activeLink : ''}>Bikes</Link>
            <Link href="/spare-parts" className={pathname === '/spare-parts' ? styles.activeLink : ''}>Spare Parts</Link>
            <Link href="/products" className={pathname === '/products' ? styles.activeLink : ''}>Shop</Link>
            <Link href="/about" className={pathname === '/about' ? styles.activeLink : ''}>About Us</Link>
            <Link href="/contact" className={pathname === '/contact' ? styles.activeLink : ''}>Contact</Link>
            <Link href="/faq" className={pathname === '/faq' ? styles.activeLink : ''}>FAQs</Link>
            <Link href="/blog" className={pathname === '/blog' ? styles.activeLink : ''}>Blog</Link>
          </nav>

          {/* --- ডান অংশ: আইকন --- */}
          <div className={styles.actionIcons}>
            <button className={styles.iconButtons} onClick={() => setIsSearchOpen(true)} aria-label="search bar">
              <IoSearch size={22} />
              <span>Search products</span>
            </button>
            <a href="https://sharifulbuilds.com/my-account/" className={`${styles.iconButton} ${styles.desktopOnly}`}>
              <IoPersonOutline size={24} />
            </a>
            <button className={styles.cartIcon} onClick={openMiniCart} aria-label="MiniCart" >
              <span>🛒</span>
              {totalItems > 0 && <span className={styles.cartCount}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- মোবাইল মেনু প্যানেল --- */}
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <div className={styles.mobileMenuHeader}>
             <button className={styles.mobileSearchButton} onClick={() => setIsSearchOpen(true) } aria-label="SearchBar">
              <IoSearch size={22} />
              <span>Search products</span>
            </button>
            <button className={styles.closeMenuButton} onClick={() => setIsMenuOpen(false)} aria-label="Close Menu">
        <IoClose size={28} />
      </button>
          </div>
            <nav className={styles.mobileMenuLinks}>
               <Link href="/" className={pathname === '/' ? styles.activeLink : ''} onClick={closeAllOverlays}>Home</Link>
               <Link href="/bikes" className={pathname === '/bikes' ? styles.activeLink : ''} onClick={closeAllOverlays}>Bikes</Link>
               <Link href="/spare-parts" className={pathname === '/spare-parts' ? styles.activeLink : ''} onClick={closeAllOverlays}>Spare Parts</Link>
               <Link href="/products" className={pathname === '/products' ? styles.activeLink : ''} onClick={closeAllOverlays}>Shop</Link>
               <Link href="/about" className={pathname === '/about' ? styles.activeLink : ''} onClick={closeAllOverlays}>About</Link>
               <Link href="/faq" className={pathname === '/faq' ? styles.activeLink : ''} onClick={closeAllOverlays}>FAQs</Link>
               <Link href="/contact" className={pathname === '/contact' ? styles.activeLink : ''} onClick={closeAllOverlays}>Contact us</Link>
               <Link href="/blog" className={pathname === '/blog' ? styles.activeLink : ''} onClick={closeAllOverlays}>Blog</Link>
            </nav>
          <div className={styles.mobileMenuFooter}>
            <a href="https://sharifulbuilds.com/my-account/" className={styles.mobileMenuLink} aria-label="My account">
                <IoPersonOutline />
                <span>My Account</span>
            </a>
          </div>
      </div>
      {isMenuOpen && <div className={styles.menuOverlay} onClick={() => setIsMenuOpen(false)} aria-label="Close"></div>}
      
      {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} aria-label="Close searchber"/>}
      <MiniCart isOpen={isMiniCartOpen} onClose={closeMiniCart} />
    </>
  );
}