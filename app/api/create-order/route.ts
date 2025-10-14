// File: app/api/create-order/route.ts
import { NextResponse } from 'next/server';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL!,
  consumerKey: process.env.WC_CONSUMER_KEY!,
  consumerSecret: process.env.WC_CONSUMER_SECRET!,
  version: "wc/v3"
});

export async function POST(request: Request) {
  try {
    const orderData = await request.json();

    const response = await api.post("orders", orderData);
    
    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error("WooCommerce API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || "Failed to create order." },
      { status: 500 }
    );
  }
}