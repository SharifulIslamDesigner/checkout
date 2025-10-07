// app/checkout/page.tsx
'use client';
import CheckoutClient from './CheckoutClient';
import styles from './CheckoutPage.module.css';
import Breadcrumbs from '../../components/Breadcrumbs';
export default function CheckoutPage() {
  return (
    <>
      <Breadcrumbs pageTitle="Checkout" />
      <div className={styles.container}><CheckoutClient /></div>
    </>
  );
}