import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// ... imports ...

export async function POST(request: Request) {
  try {
    const { amount, payment_method_types = ['card'] } = await request.json(); // payment_method_types গ্রহণ করুন
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'aud',
      // automatic_payment_methods-এর পরিবর্তে payment_method_types ব্যবহার করুন
      payment_method_types: payment_method_types,
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}