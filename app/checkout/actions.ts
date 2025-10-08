'use server';

import { revalidatePath } from "next/cache";

export async function createOrderWithRestApi(orderData: any) {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wc/v3/orders`;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return { success: false, message: 'API credentials are not configured.' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64'),
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || 'Failed to create order.';
      console.error('WooCommerce API Error:', responseData);
      return { success: false, message: errorMessage };
    }
    
    revalidatePath('/cart');
    return { 
      success: true, 
      order: {
        id: responseData.id,
        orderKey: responseData.order_key,
      } 
    };

  } catch (error) {
    console.error('Server Action Error:', error);
    return { success: false, message: 'An unexpected server error occurred.' };
  }
}