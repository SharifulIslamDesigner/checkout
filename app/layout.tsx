import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DelayedScripts from '../components/DelayedScripts';
import { ClientProviders } from "./providers"; // <-- নতুন Provider কম্পোনেন্টটি import করা হয়েছে

// --- ফন্ট কনফিগারেশন ---
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- SEO: মেটাডেটা অবজেক্ট ---
export const metadata: Metadata = {
  // metadataBase ব্যবহার করা হয়েছে যাতে সব URL স্বয়ংক্রিয়ভাবে সঠিক হয়
  metadataBase: new URL('https://gobike.au'),
  
  title: {
    default: 'GoBike - Kids Electric Bikes Australia',
    template: '%s | GoBike Australia',
  },
  description: "Australia's top-rated electric balance bikes for kids aged 2-16. Engineered for safety and built for fun. Shop now for the perfect e-bike for your child, backed by a 1-year warranty and local Aussie support.",
  
  openGraph: {
    title: 'GoBike - Kids Electric Bikes Australia',
    description: "Australia's top-rated electric balance bikes for kids.",
    url: '/', // metadataBase থাকার কারণে শুধু '/' দিলেই হবে
    siteName: 'GoBike Australia',
    images: [
      {
        url: '/og-image.png', // স্বয়ংক্রিয়ভাবে https://gobike.au/og-image.png হবে
        width: 1200,
        height: 630,
        alt: 'A child riding a GoBike electric bike.',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GoBike - Kids Electric Bikes Australia',
    description: "Australia's top-rated electric balance bikes for kids.",
    images: ['/og-image.png'], // স্বয়ংক্রিয়ভাবে https://gobike.au/og-image.png হবে
  },

  keywords: ['kids electric bike','kids ebike', 'electric bike','electric bike for kids','electric balance bike', 'ebike for kids', 'GoBike','childrens electric motorbike','toddler electric bike','buy kids ebike online','GoBike Australia'],
  authors: [{ name: 'GoBike Australia', url: 'https://gobike.au' }],
  creator: 'Shariful Islam',
  publisher: 'GoBike Australia',
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  alternates: {
    canonical: '/', // এটি প্রতিটি পেজে আলাদাভাবে override করা হবে
  },
};

// --- SEO: ভিউপোর্ট অবজেক্ট ---
export const viewport: Viewport = {
  themeColor: '#ffffff',
};

// --- মূল লেআউট কম্পোনেন্ট ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClientProviders>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </ClientProviders>
        
        <DelayedScripts />
      </body>
    </html>
  );
}