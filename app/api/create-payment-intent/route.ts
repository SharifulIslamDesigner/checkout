import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil', 
});

export async function POST(request: Request) {
  try {
    
    const { amount, payment_method_types } = await request.json();

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