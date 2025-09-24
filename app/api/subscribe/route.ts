import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    const KLAVIYO_PRIVATE_API_KEY = 'pk_94cb62e1b307a28d1b684c5c8b75f28748';
    const KLAVIYO_LIST_ID = 'S5Sg2y';
    
    if (!KLAVIYO_PRIVATE_API_KEY || !KLAVIYO_LIST_ID) {
      console.error("Klaviyo API Key or List ID is not set.");
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    // --- কার্যকরী সমাধান: দুটি ধাপে API কল ---

    // ধাপ ১: প্রোফাইল তৈরি করা বা আপডেট করা
    const createProfileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
        'accept': 'application/json',
        'content-type': 'application/json',
        'revision': '2024-02-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email: email,
          }
        }
      })
    });

    if (!createProfileResponse.ok) {
        // যদি প্রোফাইল আগে থেকেই থাকে, তাহলে Klaviyo একটি 409 Conflict এরর দেয়, যা ঠিক আছে।
        // আমরা শুধুমাত্র অন্য ধরনের এররগুলোকেই সমস্যা হিসেবে ধরব।
        if (createProfileResponse.status !== 409) {
            const errorData = await createProfileResponse.json();
            throw new Error(`Failed to create or update profile: ${errorData?.errors?.[0]?.detail}`);
        }
    }

    // Klaviyo-তে ইমেইল দিয়ে প্রোফাইল খোঁজার জন্য একটি আলাদা API কল
    const getProfileResponse = await fetch(`https://a.klaviyo.com/api/profiles/?filter=equals(email,"${encodeURIComponent(email)}")`, {
        headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
            'accept': 'application/json',
            'revision': '2024-02-15'
        }
    });
    
    const profileData = await getProfileResponse.json();
    if (!profileData.data || profileData.data.length === 0) {
        throw new Error('Could not find the created profile.');
    }
    const profileId = profileData.data[0].id;


    // ধাপ ২: প্রাপ্ত profileId ব্যবহার করে প্রোফাইলটিকে লিস্টে যোগ করা
    const addToListResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
        method: 'POST',
        headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
            'accept': 'application/json',
            'content-type': 'application/json',
            'revision': '2024-02-15'
        },
        body: JSON.stringify({
            data: [{ type: 'profile', id: profileId }]
        })
    });
    const smtpUser = 'gobike@devshariful.com';
    const smtpPass = '24816326412890Sh@';
    const notificationToEmail = 'gobike@gobike.au';

    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"GoBike Website" <${smtpUser}>`,
      to: notificationToEmail,
      subject: 'New Subscriber for GoBike!',
      html: `
        <p>A new user has subscribed to the GoBike newsletter.</p>
        <p><strong>Subscriber's Email:</strong> ${email}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    if (!addToListResponse.ok) {
        const errorData = await addToListResponse.json();
        throw new Error(`Failed to add profile to list: ${errorData?.errors?.[0]?.detail}`);
    }

    return NextResponse.json({ message: 'Thank you for subscribing!' });

  } catch (error: unknown) { // <-- সমাধান: টাইপ unknown করা হয়েছে
  
  let errorMessage = 'An unexpected error occurred.';
  if (error instanceof Error) { // <-- সমাধান: error-এর ধরন পরীক্ষা করা হচ্ছে
      errorMessage = error.message;
  }
  
  console.error("API Route /api/subscribe Error:", errorMessage);
  return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}