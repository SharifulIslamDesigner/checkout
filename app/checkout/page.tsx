import CheckoutClient from './CheckoutClient';
import styles from './CheckoutPage.module.css';

/**
 * WooCommerce API থেকে একটি পেমেন্ট গেটওয়ে অবজেক্টের গঠন কেমন হবে,
 * তা TypeScript-কে জানানোর জন্য এই Interface টি তৈরি করা হয়েছে।
 * এটি CheckoutClient কম্পোনেন্টের props-এর সাথে সামঞ্জস্যপূর্ণ।
 */
interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

/**
 * এটি একটি সার্ভার-সাইড ফাংশন। এটি শুধুমাত্র সার্ভারে রান হবে।
 * এর কাজ হলো WooCommerce REST API থেকে পেমেন্ট গেটওয়ের তালিকা নিয়ে আসা।
 * @returns {Promise<PaymentGateway[]>} فعال (enabled) পেমেন্ট গেটওয়ের একটি তালিকা।
 */
async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/payment_gateways`;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    console.error('CRITICAL ERROR: WooCommerce API credentials are not set in .env file.');
    return [];
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
      },
      // revalidate: 0 মানে হলো এই ডেটা ক্যাশ করা হবে না, প্রতিবার নতুন করে আনা হবে।
      // চেকআউটের জন্য এটিই সঠিক পদ্ধতি।
      next: { revalidate: 1800 } 
    });

    if (!response.ok) {
      console.error('Failed to fetch payment gateways from WooCommerce:', await response.text());
      return [];
    }
    
    const gateways: PaymentGateway[] = await response.json();
    
    // শুধুমাত্র যে গেটওয়েগুলো فعال (enabled) আছে, সেগুলোই পাঠানো হচ্ছে
    return gateways.filter(gateway => gateway.enabled);

  } catch (error) {
    console.error('An error occurred while fetching payment gateways:', error);
    return [];
  }
}

/**
 * এটি হলো চেকআউট পৃষ্ঠার মূল সার্ভার কম্পোনেন্ট।
 * Next.js প্রথমে এই কম্পোনেন্টটি সার্ভারে রান করবে।
 */
export default async function CheckoutPage() {
  const paymentGateways = await getPaymentGateways();
  return (
    <div className={styles.container}>
      <CheckoutClient paymentGateways={paymentGateways} />
    </div>
  );
}