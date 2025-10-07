// app/api/update-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as const,
});

export async function POST(request: Request) {
  try {
    const { paymentIntentId, amount } = await request.json();

    if (!paymentIntentId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid Payment Intent ID or amount.' }, { status: 400 });
    }

    // বিদ্যমান Payment Intent-টিকে নতুন মূল্য দিয়ে আপডেট করা হচ্ছে
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(amount * 100), // নতুন মূল্য সেন্ট-এ কনভার্ট করে
    });
    
    // সফলভাবে আপডেট হলে একটি success বার্তা পাঠানো হচ্ছে
    // এই রেসপন্সে কোনো ডেটা পাঠানোর প্রয়োজন নেই, শুধু স্ট্যাটাসই যথেষ্ট
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("[UPDATE_PAYMENT_INTENT_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}