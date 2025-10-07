// app/api/get-order/route.ts
import { NextResponse } from 'next/server';

// --- সমাধান: REST API থেকে আসা line_item-এর জন্য একটি টাইপ তৈরি করা হচ্ছে ---
interface WcLineItem {
    id: number;
    name: string;
    quantity: number;
    total: string;
    method_title?: string;
    image?: {
        id: number;
        src: string;
    };
}

export async function POST(request: Request) {
  try {
    const { orderId, orderKey } = await request.json();

    if (!orderId || !orderKey) {
      return NextResponse.json({ error: 'Order ID and Key are required.' }, { status: 400 });
    }

    const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const CONSUMER_KEY = process.env.WC_CONSUMER_KEY;
    const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET;

    if (!WORDPRESS_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
      throw new Error("API credentials are not configured on the server.");
    }

    const url = `${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch order: ${response.statusText}`);
    }

    const orderData = await response.json();

    if (orderData.order_key !== orderKey) {
      return NextResponse.json({ error: 'Invalid order key.' }, { status: 403 });
    }
     const formattedData = {
      databaseId: orderData.id,
      date: orderData.date_created,
      total: `$${orderData.total}`,
      status: orderData.status,
      paymentMethodTitle: orderData.payment_method_title,
      lineItems: {
        nodes: [
          ...orderData.line_items.map((item: WcLineItem) => ({
            product: {
              node: {
                name: item.name,
                image: {
                  sourceUrl: item.image?.src || null
                }
              }
            },
            quantity: item.quantity,
            total: `$${item.total}`,
          })),
          ...orderData.shipping_lines.map((shipping: WcLineItem) => ({
            product: { 
              node: {
                name: `Shipping: ${shipping.method_title}`,
                image: null
              }
            },
            quantity: 1,
            total: `$${shipping.total}`,
          }))
        ]
      },
      billing: {
          firstName: orderData.billing.first_name,
          lastName: orderData.billing.last_name,
          address1: orderData.billing.address_1,
          address2: orderData.billing.address_2,
          city: orderData.billing.city,
          state: orderData.billing.state,
          postcode: orderData.billing.postcode,
          country: orderData.billing.country,
          email: orderData.billing.email,
          phone: orderData.billing.phone,
      },
      shipping: {
          firstName: orderData.shipping.first_name,
          lastName: orderData.shipping.last_name,
          address1: orderData.shipping.address_1,
          address2: orderData.shipping.address_2,
          city: orderData.shipping.city,
          state: orderData.shipping.state,
          postcode: orderData.shipping.postcode,
          country: orderData.shipping.country,
      },
      customerNote: orderData.customer_note, 
    };

    return NextResponse.json(formattedData);

  } catch (error: unknown) {
    console.error("[API/GET-ORDER ERROR]:", error);
    const message = error instanceof Error ? error.message : "An internal server error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}