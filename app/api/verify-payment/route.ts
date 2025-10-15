// app/api/verify-payment/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Stripe ইনিশিয়ালাইজ করুন
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// WooCommerce API ইনিশিয়ালাইজ করুন
const wooCommerceApi = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_URL!,
  consumerKey: process.env.WC_CONSUMER_KEY!,
  consumerSecret: process.env.WC_CONSUMER_SECRET!,
  version: "wc/v3"
});

export async function POST(request: Request) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ message: 'Missing orderId or paymentIntentId' }, { status: 400 });
    }

    // ১. Stripe থেকে Payment Intent এর তথ্য আনুন এবং যাচাই করুন
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ message: 'Payment was not successful.' }, { status: 402 });
    }
    
    // ২. পেমেন্ট সফল হলে, WooCommerce অর্ডারটি আপডেট করুন
    // মেটাডেটা থেকে আসল অর্ডার আইডি আবার চেক করা একটি ভালো অভ্যাস
    const metadataOrderId = paymentIntent.metadata.order_id;
    if (metadataOrderId !== orderId) {
         return NextResponse.json({ message: 'Order ID mismatch.' }, { status: 400 });
    }

    const orderUpdateData = {
      status: 'processing', // অর্ডার স্ট্যাটাস 'প্রসেসিং'-এ পরিবর্তন করুন
      transaction_id: paymentIntent.id, // Stripe ট্রানজেকশন আইডি যোগ করুন
      set_paid: true,
    };

    const { data: updatedOrder } = await wooCommerceApi.put(`orders/${orderId}`, orderUpdateData);

    if (updatedOrder.id) {
      return NextResponse.json({ success: true, orderId: updatedOrder.id });
    } else {
      throw new Error('Failed to update WooCommerce order.');
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Payment Verification Error:', error);
    return NextResponse.json({ message }, { status: 500 });
  }
}