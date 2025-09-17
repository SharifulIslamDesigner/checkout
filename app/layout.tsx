// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CartProvider } from "../context/CartContext";
import ProgressBarWrapper from "../components/ProgressBarWrapper";
import { Toaster } from 'react-hot-toast'; 
import Script from "next/script"; // <-- Script কম্পוננט ইম্পোর্ট করা হয়েছে

// --- কার্যকরী সমাধান: আপনার সঠিক GTM আইডিটি এখানে বসান ---
const GTM_ID = 'GTM-MBDS8NJQ';
// ---------------------------------------------------------
// --- কার্যকরী সমাধান: আপনার Klaviyo Public API Key সরাসরি এখানে বসানো হয়েছে ---
const KLAVIYO_API_KEY = 'VbbJYB';
// --------------------------------------------------------------------------

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyStore - Preview",
  description: "A headless WooCommerce store under development with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.youtube.com" />
        
        {/* --- কার্যকরী সমাধান: GTM স্ক্রিপ্ট (<head> অংশ) --- */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            `,
          }}
        />
        {/* ---------------------------------------------------- */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* --- কার্যকরী সমাধান: GTM <noscript> ফলব্যাক (<body> অংশ) --- */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        {/* ---------------------------------------------------------- */}
        <Script
          id="klaviyo-script"
          strategy="afterInteractive"
          src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_API_KEY}`}
        />
        {/* ---------------------------------------------------------------------- */}
        
        <CartProvider>
          <ProgressBarWrapper />
          <Toaster position="top-center" reverseOrder={false} /> 
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}