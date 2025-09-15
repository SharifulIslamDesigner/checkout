import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // আপনার Hostinger-এর ইমেইল এবং পাসওয়ার্ড
    const user = 'guy.r.abbott@gobikezone.com';
    const pass = '24816326412890Sh@';
    const toEmail = 'gobike@gobike.au';

    // Nodemailer transporter (Hostinger-এর জন্য)
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: user,
        pass: pass,
      },
    });

    // --- কার্যকরী সমাধান: ইমেইলের অপশনগুলো উন্নত করা হয়েছে ---
    const mailOptions = {
      from: `"GoBike Australia" <${user}>`, // "From" নামটি আরও পেশাদার করা হয়েছে
      to: toEmail,
      replyTo: email, // ব্যবহারকারীর ইমেইল Reply-To তে থাকবে
      subject: `New Contact Message from ${name}`,
      
      // সুন্দর HTML বডি
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <h3 style="margin-top: 25px; color: #1a1a1a;">Message:</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
            <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">
            This email was sent from the contact form on the GoBike website.
          </p>
        </div>
      `,
      
      // একটি টেক্সট ফলব্যাক যোগ করা হয়েছে
      text: `
        New Contact Form Submission\n
        --------------------------\n
        Name: ${name}\n
        Email: ${email}\n
        ${phone ? `Phone: ${phone}\n` : ''}
        Message:\n${message}
      `
    };
    // -------------------------------------------------------------------

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error("API Route /api/contact Error:", error);
    return NextResponse.json({ message: `Error sending message: ${error}` }, { status: 500 });
  }
}