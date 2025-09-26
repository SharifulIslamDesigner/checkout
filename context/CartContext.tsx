"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient';
import { gtmAddToCart, gtmRemoveFromCart } from '../lib/gtm';
import { klaviyoTrackAddedToCart } from '../lib/klaviyo';

// ====================================================================
// GraphQL কোয়েরি এবং মিউটেশন
// ====================================================================

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

// ====================================================================
// TypeScript ইন্টারফেস এবং টাইপ (সম্পূর্ণ এবং সঠিক)
// ====================================================================

interface CartItemProductNode {
  databaseId: number;
  id: string;
  name: string;
  slug: string;
  image: { sourceUrl: string; altText: string; } | null;
  price: string;
}

interface FetchedCartItem {
  key: string;
  quantity: number;
  total: string;
  product: { node: CartItemProductNode; }
}

interface GetCartQueryData {
  cart: { contents: { nodes: FetchedCartItem[]; } | null; } | null;
}

interface AddToCartMutationData {
  addToCart: { cartItem: { product: { node: CartItemProductNode; } } }
}

interface CartItem {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string;
  image?: string;
  quantity: number;
  key: string; 
  total?: string;
}

// সমাধান: addToCart-এর itemToAdd প্যারামিটারের জন্য একটি সুনির্দিষ্ট টাইপ
interface ItemToAdd {
    id: string;
    databaseId: number;
    name: string;
    price?: string | null;
    image?: string | null;
    slug: string;
}

// সমাধান: Klaviyo আইটেমের জন্য একটি সুনির্দিষ্ট টাইপ
interface KlaviyoItem {
    ProductID: number;
    ProductName: string;
    Quantity: number;
    ItemPrice: number;
    RowTotal: number;
    ProductURL: string;
    ImageURL: string;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: ItemToAdd, quantity: number) => Promise<void>;
  updateQuantity: (key: string, newQuantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

// ====================================================================
// Context এবং Provider
// ====================================================================

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const fetchInitialCart = useCallback(async () => {
    setLoading(true);
    try {
        const { data } = await client.query<GetCartQueryData>({ query: GET_CART, fetchPolicy: 'network-only' });
        if (data?.cart?.contents?.nodes) {
            const fetchedItems = data.cart.contents.nodes.map((item: FetchedCartItem): CartItem => ({
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

  const addToCart = async (itemToAdd: ItemToAdd, quantity: number) => {
    setLoading(true);
    toast.loading("Adding to cart...");

    try {
      const { data } = await client.mutate<AddToCartMutationData>({
        mutation: ADD_TO_CART_MUTATION,
        variables: { 
          productId: itemToAdd.databaseId, 
          quantity: quantity 
        }
      });
      
      const priceString = itemToAdd.price || data?.addToCart?.cartItem?.product?.node?.price || '0';
      const priceNum = parseFloat(priceString.replace(/[^0-9.]/g, ''));

      gtmAddToCart({
          item_name: itemToAdd.name,
          item_id: itemToAdd.databaseId,
          price: priceNum,
          quantity: quantity
      });
      
      await fetchInitialCart();
      
      const { data: updatedCartState } = await client.query<GetCartQueryData>({ query: GET_CART, fetchPolicy: 'network-only' });
      
      if (updatedCartState?.cart?.contents?.nodes) {
        const updatedCartItems = updatedCartState.cart.contents.nodes;

        const klaviyoItems: KlaviyoItem[] = updatedCartItems.map((item: FetchedCartItem) => {
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

        const addedKlaviyoItem = klaviyoItems.find(item => item.ProductID === itemToAdd.databaseId);

        if (addedKlaviyoItem) {
            klaviyoTrackAddedToCart({
                total_price: klaviyoItems.reduce((acc, item) => acc + item.RowTotal, 0),
                item_count: klaviyoItems.reduce((acc, item) => acc + item.Quantity, 0),
                items: klaviyoItems,
                added_item: addedKlaviyoItem
            });
        }
      }

      toast.dismiss();
      toast.success(`"${itemToAdd.name}" updated in cart`);
      openMiniCart();

    } catch (error: unknown) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : "Could not add item to cart.";
      toast.error(errorMessage);
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
            variables: { items: [{ key, quantity: newQuantity }] },
        });
        await fetchInitialCart();
        toast.dismiss();
        toast.success("Cart updated!");
    } catch (error: unknown) {
        toast.dismiss();
        const errorMessage = error instanceof Error ? error.message : "Could not update quantity.";
        toast.error(errorMessage);
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
      
      await fetchInitialCart();
      toast.error(`"${itemToRemove.name}" removed from cart.`);

    } catch (error: unknown) { 
      const errorMessage = error instanceof Error ? error.message : "Could not remove item.";
      toast.error(errorMessage);
    } finally { 
      setLoading(false); 
    }
  };

  const clearCart = async () => { 
    if (cartItems.length === 0 && !localStorage.getItem('woo-session')) {
        // যদি কার্ট এবং সেশন দুটোই খালি থাকে, তাহলে কিছু করার দরকার নেই
        return;
    }
    
    setLoading(true);
    try {
      // ধাপ ১: WooCommerce সার্ভারে কার্ট খালি করার জন্য মিউটেশন পাঠানো হচ্ছে
      await client.mutate({ mutation: CLEAR_CART_MUTATION });
      
      // ধাপ ২: ব্রাউজারের লোকাল স্টেট খালি করা হচ্ছে
      setCartItems([]);

      // ধাপ ৩ (সবচেয়ে গুরুত্বপূর্ণ): WooCommerce সেশন টোকেন মুছে ফেলা হচ্ছে
      localStorage.removeItem('woo-session');
      
      toast.success("Cart has been cleared.");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not clear the cart.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value = { cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart, isMiniCartOpen, openMiniCart, closeMiniCart };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) { throw new Error('useCart must be used within a CartProvider'); }
  return context;
}