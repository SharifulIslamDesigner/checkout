// app/api/create-payment-intent/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// আপনার Stripe ভার্সন এবং ইনিশিয়ালাইজেশন অপরিবর্তিত থাকবে
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', // অনুগ্রহ করে একটি স্থিতিশীল API ভার্সন ব্যবহার করুন
});

export async function POST(request: Request) {
  try {
    
    // ★★★ পরিবর্তন ১: metadata কেও রিকোয়েস্ট বডি থেকে গ্রহণ করুন ★★★
    const { amount, payment_method_types, metadata } = await request.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const intentOptions: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: 'aud',
    };

    if (payment_method_types) {
      intentOptions.payment_method_types = payment_method_types;
    } else {
      intentOptions.automatic_payment_methods = { enabled: true };
    }
    
    // ★★★ পরিবর্তন ২: যদি metadata থাকে, তাহলে সেটিকে intentOptions এ যোগ করুন ★★★
    if (metadata) {
      intentOptions.metadata = metadata;
    }

    const paymentIntent = await stripe.paymentIntents.create(intentOptions);
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: unknown) { 
    console.error("[CREATE_PAYMENT_INTENT_ERROR]:", error);
    
    let errorMessage = "An internal server error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}