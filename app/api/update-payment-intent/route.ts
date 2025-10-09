// app/api/update-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', 
});

export async function POST(request: Request) {
  try {
    const { paymentIntentId, amount } = await request.json();

    if (!paymentIntentId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid Payment Intent ID or amount.' }, { status: 400 });
    }
    
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(amount * 100),
    });
    
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("[UPDATE_PAYMENT_INTENT_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}