// app/checkout/CheckoutClient.tsx
'use client';

// ★★★ সমাধান ১: useRef হুকটি ইম্পোর্ট করুন ★★★
import { useEffect, useCallback, useReducer, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import client from '../../lib/apolloClient';
import toast from 'react-hot-toast';
import styles from './CheckoutClient.module.css';

// ... (অন্যান্য সব কম্পোনেন্ট ইম্পোর্ট আগের মতোই থাকবে)
import OrderNotes from './components/OrderNotes';
import ShippingForm from './components/ShippingForm';
import OrderSummary from './components/OrderSummary';
import PaymentMethods from './components/PaymentMethods';


// --- Interfaces, GraphQL Queries, Reducer, and Helpers (No changes) ---
interface ShippingFormData { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface ShippingRate { id: string; label: string; cost: string; }
interface AppliedCoupon { code: string; discountAmount: string; }
interface CartData { subtotal: string; total: string; shippingTotal: string; discountTotal: string; appliedCoupons: AppliedCoupon[] | null; availableShippingMethods?: { rates: ShippingRate[] }[] | null }
interface CheckoutData { checkout: { result: string; redirect: string | null; order: { databaseId: number; orderKey: string; }; }; }
const GET_CHECKOUT_DATA = gql` query GetCheckoutData { cart { subtotal(format: FORMATTED) total(format: FORMATTED) shippingTotal(format: FORMATTED) discountTotal(format: FORMATTED) appliedCoupons { code discountAmount(format: FORMATTED) } availableShippingMethods { rates { id label cost } } } } `;
const APPLY_COUPON_MUTATION = gql` mutation ApplyCoupon($input: ApplyCouponInput!) { applyCoupon(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const REMOVE_COUPON_MUTATION = gql` mutation RemoveCoupons($input: RemoveCouponsInput!) { removeCoupons(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const UPDATE_CUSTOMER_MUTATION = gql`mutation UpdateCustomerForCheckout($input: UpdateCustomerInput!) { updateCustomer(input: $input) { customer { id } } }`;
const UPDATE_SHIPPING_METHOD_MUTATION = gql`mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { cart { total } } }`;
const CHECKOUT_MUTATION = gql`mutation Checkout($input: CheckoutInput!) { checkout(input: $input) { result redirect order { databaseId orderKey } } }`;
type State = { customerInfo: Partial<ShippingFormData>; shippingRates: ShippingRate[]; selectedShipping: string; selectedPaymentMethod: string; cartData: CartData | null; orderNotes: string; addressInputStarted: boolean; loading: { cart: boolean; shipping: boolean; applyingCoupon: boolean; removingCoupon: boolean; order: boolean; }; };
type Action = | { type: 'SET_FIELD'; field: keyof State; payload: any } | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean } | { type: 'SET_CHECKOUT_DATA'; payload: { cart: CartData } } | { type: 'UPDATE_TOTALS'; payload: { shippingTotal: string; total: string } };
const initialState: State = { customerInfo: {}, shippingRates: [], selectedShipping: '', selectedPaymentMethod: 'cod', cartData: null, orderNotes: '', addressInputStarted: false, loading: { cart: true, shipping: false, applyingCoupon: false, removingCoupon: false, order: false }, };
function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD': 
            if (action.field === 'customerInfo') {
                return { ...state, customerInfo: { ...state.customerInfo, ...action.payload, }, };
            }
            return { ...state, [action.field]: action.payload };

        case 'SET_LOADING': 
            return { ...state, loading: { ...state.loading, [action.key]: action.payload } };

        case 'SET_CHECKOUT_DATA':
            const rates = action.payload.cart?.availableShippingMethods?.[0]?.rates || [];
            // ★★★ সমাধান ৩: শিপিং রেট পাওয়ার সাথে সাথেই প্রথম অপশনটিকে ডিফল্ট হিসেবে সেট করা হচ্ছে ★★★
            const newSelectedShipping = rates.length > 0 ? rates[0].id : '';

            return { 
                ...state, 
                cartData: action.payload.cart, 
                shippingRates: rates, 
                // যদি আগের সিলেক্ট করা মেথডটি নতুন তালিকাতেও থাকে, তাহলে সেটিই রাখা হবে, নাহলে নতুন ডিফল্টটি সেট হবে
                selectedShipping: rates.some(rate => rate.id === state.selectedShipping) ? state.selectedShipping : newSelectedShipping,
            };

         case 'UPDATE_TOTALS':
            if (!state.cartData) return state; // যদি cartData না থাকে, কিছু করার নেই
            return {
                ...state,
                cartData: {
                    ...state.cartData,
                    shippingTotal: action.payload.shippingTotal,
                    total: action.payload.total,
                },
            };

        default: 
            return state;
    }
}
function isApolloError(error: unknown): boolean { return (typeof error === 'object' && error !== null && 'graphQLErrors' in error); }
const getErrorMessage = (error: unknown): string => { if (isApolloError(error) && Array.isArray((error as any).graphQLErrors) && (error as any).graphQLErrors.length > 0) { return (error as any).graphQLErrors[0].message; } if (error instanceof Error) { return error.message.replace(/<[^>]*>?/gm, ''); } return 'An unexpected error occurred.'; };


export default function CheckoutClient() {
  const router = useRouter();
  const { cartItems, loading: isCartContextLoading, clearCart } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const { customerInfo, shippingRates, selectedShipping, selectedPaymentMethod, cartData, orderNotes, addressInputStarted, loading } = state;

  // ★★★ সমাধান ২: একটি ref তৈরি করুন যা customerInfo-এর সর্বশেষ মান ধরে রাখবে ★★★
  const customerInfoRef = useRef(customerInfo);
  useEffect(() => {
    customerInfoRef.current = customerInfo;
  }, [customerInfo]);

  const refetchCartData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', key: 'cart', payload: true });
    try {
      const { data } = await client.query<{ cart: CartData }>({ query: GET_CHECKOUT_DATA, fetchPolicy: 'network-only' });
      if (data?.cart) {
        dispatch({ type: 'SET_CHECKOUT_DATA', payload: { cart: data.cart } });
      }
    } catch (err) {
      toast.error('Could not refresh cart data.');
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'cart', payload: false });
    }
  }, []);

  useEffect(() => {
    if (!isCartContextLoading && cartItems.length === 0) router.push('/cart');
    else refetchCartData();
  }, [isCartContextLoading, cartItems.length, router, refetchCartData]);
  
  // ★★★ সমাধান ৩: handleAddressChange থেকে customerInfo dependency সরিয়ে দিন ★★★
  const handleAddressChange = useCallback(async (address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_FIELD', field: 'customerInfo', payload: address });
    if (!addressInputStarted) dispatch({ type: 'SET_FIELD', field: 'addressInputStarted', payload: true });

    // state থেকে customerInfo না নিয়ে, ref থেকে সর্বশেষ মানটি নিন
    const updatedCustomerInfo = { ...customerInfoRef.current, ...address };
    
    if (updatedCustomerInfo.city && updatedCustomerInfo.postcode && updatedCustomerInfo.state) {
      dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });
      try { 
        await client.mutate({ mutation: UPDATE_CUSTOMER_MUTATION, variables: { input: { shipping: updatedCustomerInfo, billing: updatedCustomerInfo } } }); 
        await refetchCartData(); 
      } catch (err) { 
        toast.error('Could not calculate shipping.'); 
      } finally { 
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false }); 
      }
    }
  }, [addressInputStarted, refetchCartData]); // <-- dependency array থেকে customerInfo সরানো হয়েছে

  // --- কুপন ফাংশনগুলো আগের মতোই নির্ভরযোগ্য থাকবে ---
  const handleApplyCoupon = async (couponCode: string) => {
    dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: true });
    toast.loading('Applying coupon...');
    try {
      await client.mutate({ mutation: APPLY_COUPON_MUTATION, variables: { input: { code: couponCode } } });
      await refetchCartData();
      toast.dismiss();
      toast.success('Coupon applied!');
    } catch (error) {
      toast.dismiss();
      toast.error(getErrorMessage(error));
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: false });
    }
  };
  const handleRemoveCoupon = async (couponCode: string) => {
    if (loading.removingCoupon) return;
    dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: true });
    toast.loading('Removing coupon...');
    try {
      await client.mutate({ mutation: REMOVE_COUPON_MUTATION, variables: { input: { codes: [couponCode] } } });
      await refetchCartData();
      toast.dismiss();
      toast.success('Coupon removed.');
    } catch (error) {
      toast.dismiss();
      toast.error(getErrorMessage(error));
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: false });
    }
  };

  // --- বাকি কোড অপরিবর্তিত ---
  const handleShippingSelect = (rateId: string) => {
    
    // ধাপ ১: UI-কে তাৎক্ষণিকভাবে আপডেট করার জন্য reducer-কে কল করা
    dispatch({ type: 'SET_FIELD', field: 'selectedShipping', payload: rateId });

    // ধাপ ২: নতুন Total ক্লায়েন্ট-সাইডে গণনা করা
    const selectedRate = shippingRates.find(rate => rate.id === rateId);
    if (cartData && selectedRate) {
      const subtotal = parseFloat(cartData.subtotal.replace(/[^0-9.]/g, '')) || 0;
      const discount = parseFloat(cartData.discountTotal.replace(/[^0-9.]/g, '')) || 0;
      const shippingCost = parseFloat(selectedRate.cost) || 0;
      const newTotal = (subtotal - discount) + shippingCost;

      // নতুন গণনা করা Total দিয়ে cartData-কে তাৎক্ষণিকভাবে আপডেট করা
      // এটি করার জন্য আমাদের একটি নতুন reducer action লাগবে
      dispatch({ 
        type: 'UPDATE_TOTALS', 
        payload: { 
          shippingTotal: `$${shippingCost.toFixed(2)}`, // একটি আনুমানিক মান
          total: `$${newTotal.toFixed(2)}` 
        } 
      });
    }

    // ধাপ ৩: ব্যাকগ্রাউন্ডে সার্ভারকে আপডেট পাঠানো (ব্যবহারকারীকে অপেক্ষা করানো হবে না)
    client.mutate({
      mutation: UPDATE_SHIPPING_METHOD_MUTATION,
      variables: { input: { shippingMethods: [rateId] } },
    }).catch(err => {
      // যদি কোনো কারণে সার্ভার আপডেট ব্যর্থ হয়, তাহলে ব্যবহারকারীকে জানানো যেতে পারে
      console.error("Failed to sync shipping method with server:", err);
      toast.error("Could not save shipping preference.");
    });
  };
  const handlePlaceOrder = async (paymentData?: { paymentMethodId?: string }) => {
    if (!selectedShipping) { toast.error("Please select a shipping method."); return; }
    if (!customerInfoRef.current || !customerInfoRef.current.firstName || !customerInfoRef.current.email) { toast.error("Please fill in all required shipping details."); return; }
    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });
    toast.loading('Placing order...');
    try {
        const input = { paymentMethod: selectedPaymentMethod, shippingMethod: selectedShipping, customerNote: orderNotes, billing: customerInfoRef.current, shipping: customerInfoRef.current, ...paymentData };
        const { data } = await client.mutate<{ checkout: CheckoutData['checkout'] }>({ mutation: CHECKOUT_MUTATION, variables: { input } });
        if (data?.checkout.result === 'success') {
            const { databaseId, orderKey } = data.checkout.order;
            if (databaseId && orderKey) {
                toast.dismiss();
                
                router.push(`/order-success?order_id=${databaseId}&key=${orderKey}`);
                if (typeof clearCart === 'function') await clearCart();
            } else { throw new Error("Order placed, but failed to retrieve order details for redirection."); }
        } else { throw new Error(data?.checkout.redirect || 'Order placement failed. Please check your details.'); }
    } catch (error) {
        toast.dismiss();
        toast.error(getErrorMessage(error), { duration: 6000 });
        dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
    }
  };

  const total = cartData?.total ? parseFloat(cartData.total.replace(/[^0-9.]/g, '')) : 0;
  if (loading.cart && !cartData) { return ( <div className={styles.pageLoader}><h1 className={styles.loaderTitle}>Checkout</h1></div> ); }

  return (
    <div className={styles.checkoutLayout}>
      <div className={styles.leftColumn}>
        <ShippingForm onAddressChange={handleAddressChange} />
        <OrderNotes notes={orderNotes} onNotesChange={(notes) => dispatch({ type: 'SET_FIELD', field: 'orderNotes', payload: notes })} />
      </div>
      <div className={styles.rightColumn}>
        {/* ★★★ চূড়ান্ত সমাধান: এখন শুধুমাত্র একটি কম্পোনেন্ট রেন্ডার হচ্ছে ★★★ */}
        <OrderSummary
          // OrderSummary-এর props
          cartItems={cartItems}
          cartData={cartData}
          onRemoveCoupon={handleRemoveCoupon}
          isRemovingCoupon={loading.removingCoupon}
          
          // CouponForm-এর props
          onApplyCoupon={handleApplyCoupon}
          isApplyingCoupon={loading.applyingCoupon}
          
          // ShippingOptions-এর props
          rates={shippingRates}
          selectedRateId={selectedShipping}
          onRateSelect={handleShippingSelect}
          isLoadingShipping={loading.shipping} // prop-এর নাম পরিবর্তন করেছি যাতে কনফ্লিক্ট না হয়
          addressEntered={addressInputStarted}
        />
        <PaymentMethods 
          selectedPaymentMethod={selectedPaymentMethod} 
          onPaymentMethodChange={(method) => dispatch({ type: 'SET_FIELD', field: 'selectedPaymentMethod', payload: method })} 
          onPlaceOrder={handlePlaceOrder} 
          isPlacingOrder={loading.order} 
          total={total} 
          isShippingSelected={!!selectedShipping} 
        />
      </div>
    </div>
  );
}