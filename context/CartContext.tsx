"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { gql } from '@apollo/client';
import client from '../lib/apolloClient';

// --- GraphQL Mutations and Queries ---
const ADD_TO_CART_MUTATION = gql`
  mutation AddToCart($productId: Int!, $quantity: Int!) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cartItem { key quantity total product { node { databaseId id name image { sourceUrl altText } ...on ProductWithPricing { price(format: FORMATTED) } } } }
    }
  }
`;
const UPDATE_CART_ITEM_QUANTITIES_MUTATION = gql`
  mutation UpdateCartItemQuantities($items: [CartItemQuantityInput]!) {
    updateItemQuantities(input: { items: $items }) {
      items { key quantity total product { node { price(format: FORMATTED) } } }
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

// --- Interfaces ---
interface CartItem {
  id: string;
  databaseId: number;
  name: string;
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
            image: { sourceUrl: string; altText: string; };
            price: string;
        }
    }
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: { databaseId: number, id: string, name: string, price?: string, image?: string }, quantity: number) => Promise<void>;
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

  const addToCart = async (itemToAdd: Omit<CartItem, 'quantity' | 'key' | 'price' | 'image'> & { price?: string, image?: string }, quantity: number) => {
    setLoading(true);
    toast.loading("Adding to cart...");

    try {
      await client.mutate({
        mutation: ADD_TO_CART_MUTATION,
        variables: { 
          productId: itemToAdd.databaseId, 
          quantity: quantity 
        }
      });
      await fetchInitialCart(); 

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
    try {
      await client.mutate({
        mutation: UPDATE_CART_ITEM_QUANTITIES_MUTATION,
        variables: { items: [{ key: key, quantity: newQuantity }] }
      });
      const updatedItemData = data.updateItemQuantities.items[0];
      setCartItems(prevItems =>
        prevItems.map(item => 
          item.key === key 
            ? { ...item, quantity: updatedItemData.quantity, total: updatedItemData.total, price: updatedItemData.product.node.price } 
            : item
        )
      );

    } catch (error: any) {
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
      setCartItems(prevItems => prevItems.filter(item => item.key !== key));
      toast.error(`"${itemToRemove.name}" removed from cart.`);
      await fetchInitialCart();
    } catch (error: any) { toast.error(error.message || "Could not remove item.");
    } finally { setLoading(false); }
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