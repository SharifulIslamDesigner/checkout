import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // ফ্রন্ট-এন্ড থেকে পাঠানো FormData গ্রহণ করা হচ্ছে
        const formData = await request.formData();
        
        // WordPress-এর ডিফল্ট কমেন্ট সাবমিশন এন্ডপয়েন্ট
        const endpoint = 'https://sharifulbuilds.com/wp-comments-post.php';

        // সার্ভার-সাইড থেকে WordPress-এ রিকোয়েস্ট পাঠানো হচ্ছে
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
             
            // সার্ভার-টু-সার্ভার রিকোয়েস্টে সাধারণত 'Origin' হেডার থাকে না,
            // যা CORS সমস্যা এড়াতে সাহায্য করে।
        });
        
        // WordPress সফল হলে একটি redirect response (status 302) পাঠায়
        // অথবা কোনো error থাকলে ভিন্ন স্ট্যাটাস কোড পাঠাতে পারে।
        // আমরা এখানে উদারভাবে চেক করছি।
        if (response.ok || response.status < 400 || response.redirected) {
            return NextResponse.json({ success: true, message: 'Review submitted successfully and is awaiting approval.' });
        } else {
            // যদি WordPress থেকে কোনো error আসে, সেটি দেখানোর চেষ্টা করা হচ্ছে
            const errorText = await response.text();
            console.error("WordPress comment submission error:", errorText);
            throw new Error(`Failed to submit review. WordPress responded with status ${response.status}`);
        }

    } catch (error: unknown) { // <-- সমাধান: টাইপ unknown করা হয়েছে
  
  let errorMessage = 'An unexpected error occurred.';
  if (error instanceof Error) { // <-- সমাধান: error-এর ধরন পরীক্ষা করা হচ্ছে
      errorMessage = error.message;
  }
  
  console.error("API Route /api/submit reviwe :", errorMessage);
  return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}