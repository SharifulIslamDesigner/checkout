"use client"; // <-- এটি একটি ক্লায়েন্ট কম্পোনেন্ট

import { CartProvider } from "../context/CartContext";
import ProgressBarWrapper from "../components/ProgressBarWrapper";
import { Toaster } from 'react-hot-toast'; 

// React-এর children prop-এর জন্য টাইপ ডিফাইন করা
type Props = {
  children: React.ReactNode;
};

export function ClientProviders({ children }: Props) {
  return (
    <CartProvider>
      <ProgressBarWrapper />
      <Toaster position="top-center" reverseOrder={false} />
      {children}
    </CartProvider>
  );
}