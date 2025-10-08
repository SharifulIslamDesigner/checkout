import CheckoutClient from './CheckoutClient';
import styles from './CheckoutPage.module.css';

// WooCommerce থেকে পেমেন্ট গেটওয়ে আনার জন্য async ফাংশন
async function getPaymentGateways() {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/payment_gateways`;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    console.error('ERROR: WooCommerce API credentials missing.');
    return [];
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
      },
      next: { revalidate: 3600 } // ১ ঘন্টার জন্য ক্যাশ করা হবে
    });

    if (!response.ok) {
      console.error('Failed to fetch payment gateways:', await response.text());
      return [];
    }
    
    const gateways = await response.json();
    return gateways.filter(gateway => gateway.enabled);

  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return [];
  }
}

export default async function CheckoutPage() {
  const paymentGateways = await getPaymentGateways();

  return (
    <div className={styles.container}>
      <CheckoutClient paymentGateways={paymentGateways} />
    </div>
  );
}