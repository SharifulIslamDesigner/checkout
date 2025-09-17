"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient';
import { gtmAddToCart, gtmRemoveFromCart } from '../lib/gtm';
import { klaviyoTrackAddedToCart } from '../lib/klaviyo';

// --- GraphQL কোয়েরি এবং মিউটেশন (অপরিবর্তিত) ---
const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($productId: Int!, $quantity: Int!) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cartItem { key quantity total product { node { databaseId id name slug image { sourceUrl } ...on ProductWithPricing { price(format: FORMATTED) } } } }
    }
  }
`;
const UPDATE_CART_ITEM_QUANTITIES_MUTATION = gql`
  mutation UpdateCartItemQuantities($items: [CartItemQuantityInput]!) {
    updateItemQuantities(input: { items: $items }) {
      refreshedCart { contents { nodes { key quantity total product { node { price(format: FORMATTED) } } } } }
    }
  }
`;
const REMOVE_ITEMS_FROM_CART_MUTATION = gql`
  mutation RemoveItemsFromCart($keys: [ID]!) {
    removeItemsFromCart(input: { keys: $keys, all: false }) {
      cartItems { key }
    }
  }
`;
const GET_CART = gql`
  query GetCart {
    cart {
      contents {
        nodes {
          key
          quantity
          total
          product {
            node {
              databaseId
              id
              name
              slug
              image { sourceUrl altText }
              ... on SimpleProduct { price(format: FORMATTED) }
              ... on VariableProduct { price(format: FORMATTED) }
            }
          }
        }
      }
    }
  }
`;
const CLEAR_CART_MUTATION = gql`
    mutation ClearCart {
        emptyCart(input: {}) {
            clientMutationId
        }
    }
`;

// --- ইন্টারফেস (slug যোগ করা হয়েছে) ---
interface CartItem {
  id: string;
  databaseId: number;
  name: string;
  slug: string; // <-- slug যোগ করা হয়েছে
  price: string;
  image?: string;
  quantity: number;
  key: string; 
  total?: string;
}

interface FetchedCartItem {
    key: string;
    quantity: number;
    total: string;
    product: {
        node: {
            databaseId: number;
            id: string;
            name: string;
            slug: string;
            image: { sourceUrl: string; altText: string; };
            price: string;
        }
    }
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: any, quantity: number) => Promise<void>; // <-- item-এর টাইপ any করা হয়েছে সরলতার জন্য
  updateQuantity: (key: string, newQuantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const fetchInitialCart = useCallback(async () => {
    setLoading(true);
    try {
        const { data } = await client.query({ query: GET_CART, fetchPolicy: 'network-only' });
        if (data.cart?.contents?.nodes) {
            const fetchedItems = data.cart.contents.nodes.map((item: FetchedCartItem) => ({
                id: item.product.node.id,
                databaseId: item.product.node.databaseId,
                name: item.product.node.name,
                slug: item.product.node.slug,
                price: item.product.node.price,
                image: item.product.node.image?.sourceUrl,
                quantity: item.quantity,
                key: item.key,
                total: item.total,
            }));
            setCartItems(fetchedItems);
        }
    } catch (error) { console.error("Failed to fetch initial cart", error); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchInitialCart();
  }, [fetchInitialCart]);


  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  const addToCart = async (itemToAdd: any, quantity: number) => {
    setLoading(true);
    toast.loading("Adding to cart...");

    try {
      const { data } = await client.mutate({
        mutation: ADD_TO_CART_MUTATION,
        variables: { 
          productId: itemToAdd.databaseId, 
          quantity: quantity 
        }
      });
      
      const priceString = itemToAdd.price || data?.addToCart?.cartItem?.product?.node?.price || '0';
      const priceNum = parseFloat(priceString.replace(/[^0-9.]/g, ''));

      // GTM ইভেন্ট
      gtmAddToCart({
          item_name: itemToAdd.name,
          item_id: itemToAdd.databaseId,
          price: priceNum,
          quantity: quantity
      });
      
      await fetchInitialCart();

      // fetchInitialCart সম্পন্ন হওয়ার পর Klaviyo ইভেন্ট পাঠানো হচ্ছে
      // যাতে আমাদের কাছে সম্পূর্ণ এবং আপ-টু-ডেট কার্টের তথ্য থাকে
      
      const updatedCartState = await client.query({ query: GET_CART, fetchPolicy: 'network-only' });
      const updatedCartItems = updatedCartState.data.cart.contents.nodes;

      const klaviyoItems = updatedCartItems.map((item: FetchedCartItem) => {
          const itemPrice = parseFloat(item.product.node.price.replace(/[^0-9.]/g, ''));
          return {
            ProductID: item.product.node.databaseId,
            ProductName: item.product.node.name,
            Quantity: item.quantity,
            ItemPrice: itemPrice,
            RowTotal: itemPrice * item.quantity,
            ProductURL: `${window.location.origin}/product/${item.product.node.slug}`,
            ImageURL: item.product.node.image?.sourceUrl || ''
          };
      });

      const addedKlaviyoItem = klaviyoItems.find((item: any) => item.ProductID === itemToAdd.databaseId);

      if (addedKlaviyoItem) {
          klaviyoTrackAddedToCart({
              total_price: klaviyoItems.reduce((acc: number, item: any) => acc + item.RowTotal, 0),
              item_count: klaviyoItems.reduce((acc: number, item: any) => acc + item.Quantity, 0),
              items: klaviyoItems,
              added_item: addedKlaviyoItem
          });
      }

      toast.dismiss();
      toast.success(`"${itemToAdd.name}" updated in cart`);
      openMiniCart();

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Could not add item to cart.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (key: string, newQuantity: number) => {
    if (newQuantity < 1) {
        await removeFromCart(key);
        return;
    }
    setLoading(true);
    toast.loading("Updating cart...");
    try {
        await client.mutate({
            mutation: UPDATE_CART_ITEM_QUANTITIES_MUTATION,
            variables: { items: [{ key: key, quantity: newQuantity }] },
            refetchQueries: [{ query: GET_CART }]
        });
        toast.dismiss();
        toast.success("Cart updated!");
    } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || "Could not update quantity.");
    } finally {
        setLoading(false);
    }
  };

  const removeFromCart = async (key: string) => {
    const itemToRemove = cartItems.find(item => item.key === key);
    if (!itemToRemove) return;

    setLoading(true);
    try {
      await client.mutate({
        mutation: REMOVE_ITEMS_FROM_CART_MUTATION,
        variables: { keys: [key] }
      });

      const priceNum = parseFloat(itemToRemove.price?.replace(/[^0-9.]/g, '') || '0');
      gtmRemoveFromCart({
          item_name: itemToRemove.name,
          item_id: itemToRemove.databaseId,
          price: priceNum,
          quantity: itemToRemove.quantity
      });
      
      toast.error(`"${itemToRemove.name}" removed from cart.`);
      await fetchInitialCart();

    } catch (error: any) { 
      toast.error(error.message || "Could not remove item.");
    } finally { 
      setLoading(false); 
    }
  };

  const clearCart = async () => { 
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      await client.mutate({ mutation: CLEAR_CART_MUTATION });
      setCartItems([]);
      toast.success("Cart has been cleared.");
    } catch (error: any) {
      toast.error(error.message || "Could not clear the cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart, isMiniCartOpen, openMiniCart, closeMiniCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) { throw new Error('useCart must be used within a CartProvider'); }
  return context;
}