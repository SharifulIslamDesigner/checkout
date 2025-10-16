// File: app/api/create-order/route.ts
import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL!,
  consumerKey: process.env.WC_CONSUMER_KEY!,
  consumerSecret: process.env.WC_CONSUMER_SECRET!,
  version: "wc/v3"
});
interface WooErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    const response = await api.post("orders", orderData);
    
    return NextResponse.json(response.data);

  } catch (error: unknown) { // ★★★ পরিবর্তন ১: 'any'-এর পরিবর্তে 'unknown' ব্যবহার করুন ★★★
    
    // ★★★ পরিবর্তন ২: error-এর টাইপ পরীক্ষা করুন ★★★
    let errorMessage = "Failed to create order.";

    // error অবজেক্টটি আসলেই একটি অবজেক্ট কিনা এবং তাতে প্রয়োজনীয় প্রপার্টি আছে কিনা তা পরীক্ষা করা হচ্ছে
    const wooError = error as WooErrorResponse;
    if (wooError.response?.data?.message) {
      errorMessage = wooError.response.data.message;
    } else if (wooError.message) {
      errorMessage = wooError.message;
    }
    
    console.error("WooCommerce API Error:", wooError);
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}