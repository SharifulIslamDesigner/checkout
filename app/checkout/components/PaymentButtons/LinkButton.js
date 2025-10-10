import React from 'react';
import { ExpressCheckoutElement } from '@stripe/react-stripe-js';

const LinkButton = ({ onConfirm }) => {
  const options = {
    paymentMethods: {
      link: 'auto', // শুধু Link অটোমেটিক দেখাবে
      googlePay: 'auto', // অন্যগুলো বন্ধ থাকবে
      applePay: 'auto',
    },
  };

  return <ExpressCheckoutElement options={options} onConfirm={onConfirm} />;
};

export default LinkButton;