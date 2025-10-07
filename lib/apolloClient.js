// lib/apolloClient.js (চূড়ান্ত সঠিক সংস্করণ - কোনো .env ফাইল ছাড়াই)

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// এই ক্লায়েন্টটি শুধুমাত্র ক্লায়েন্ট কম্পোনেন্টে ("use client") ব্যবহার করা হবে।

const httpLink = createHttpLink({
  // --- সমাধান: সরাসরি লিঙ্ক ব্যবহার করা হয়েছে ---
  uri: "https://shop.sharifulbuilds.com/graphql",
  
  fetch: async (uri, options) => {
    const token = localStorage.getItem('woo-session');
    if (token) {
      options.headers = {
        ...options.headers,
        'woocommerce-session': `Session ${token}`
      };
    }

    const response = await fetch(uri, options);
    
    const session = response.headers.get('woocommerce-session');
    if (session) {
      const newToken = session.split(';')[0].trim();
      if (newToken) {
        localStorage.setItem('woo-session', newToken);
      }
    }

    return response;
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    }
  },
});

export default client;