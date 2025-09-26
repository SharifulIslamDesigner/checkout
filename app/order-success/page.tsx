import { Suspense } from 'react';
import OrderSuccessClient from './OrderSuccessClient';
import styles from './OrderSuccessPage.module.css';

function LoadingFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.successBox}>
        <div className={styles.loadingSpinner}></div>
        <h1 className={styles.title}>Processing Your Order...</h1>
        <p className={styles.message}>Please wait while we confirm your purchase.</p>
      </div>
    </div>
  );
}
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessClient />
    </Suspense>
  );
}