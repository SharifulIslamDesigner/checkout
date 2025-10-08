'use client';

// ★ ধাপ ১: Stripe-এর প্রয়োজনীয় হুক এবং প্রোভাইডার আমদানি করুন
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { createOrderWithRestApi } from './actions'; 
import { useEffect, useCallback, useReducer, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import client from '../../lib/apolloClient';
import toast from 'react-hot-toast';
import styles from './CheckoutClient.module.css';

import OrderNotes from './components/OrderNotes';
import ShippingForm from './components/ShippingForm';
import OrderSummary from './components/OrderSummary';
import PaymentMethods from './components/PaymentMethods';

// --- Interfaces, GraphQL Queries, Reducer ---
interface ShippingFormData { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface ShippingRate { id: string; label: string; cost: string; }
interface AppliedCoupon { code: string; }
interface CartData { subtotal: string; total: string; shippingTotal: string; discountTotal: string; appliedCoupons: AppliedCoupon[] | null; availableShippingMethods?: { rates: ShippingRate[] }[] | null }
interface PaymentGateway { id: string; title: string; description: string; }

const GET_CHECKOUT_DATA = gql` query GetCheckoutData { cart { subtotal(format: FORMATTED) total(format: FORMATTED) shippingTotal(format: FORMATTED) discountTotal(format: FORMATTED) appliedCoupons { code } availableShippingMethods { rates { id label cost } } } } `;
const APPLY_COUPON_MUTATION = gql` mutation ApplyCoupon($input: ApplyCouponInput!) { applyCoupon(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const REMOVE_COUPON_MUTATION = gql` mutation RemoveCoupons($input: RemoveCouponsInput!) { removeCoupons(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const UPDATE_CUSTOMER_MUTATION = gql`mutation UpdateCustomerForCheckout($input: UpdateCustomerInput!) { updateCustomer(input: $input) { customer { id } } }`;
const UPDATE_SHIPPING_METHOD_MUTATION = gql`mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { cart { total } } }`;

type State = { customerInfo: Partial<ShippingFormData>; shippingRates: ShippingRate[]; selectedShipping: string; selectedPaymentMethod: string; cartData: CartData | null; orderNotes: string; addressInputStarted: boolean; loading: { cart: boolean; shipping: boolean; applyingCoupon: boolean; removingCoupon: boolean; order: boolean; }; };
type Action = | { type: 'SET_FIELD'; field: keyof State; payload: any } | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean } | { type: 'SET_CHECKOUT_DATA'; payload: { cart: CartData } } | { type: 'UPDATE_TOTALS'; payload: { shippingTotal: string; total: string } };

const initialState: State = { customerInfo: {}, shippingRates: [], selectedShipping: '', selectedPaymentMethod: 'stripe', cartData: null, orderNotes: '', addressInputStarted: false, loading: { cart: true, shipping: false, applyingCoupon: false, removingCoupon: false, order: false }, };

function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD': 
            if (action.field === 'customerInfo') { return { ...state, customerInfo: { ...state.customerInfo, ...action.payload, }, }; }
            return { ...state, [action.field]: action.payload };
        case 'SET_LOADING': 
            return { ...state, loading: { ...state.loading, [action.key]: action.payload } };
        case 'SET_CHECKOUT_DATA':
            const rates = action.payload.cart?.availableShippingMethods?.[0]?.rates || [];
            const newSelectedShipping = rates.length > 0 ? rates[0].id : '';
            return { ...state, cartData: action.payload.cart, shippingRates: rates, selectedShipping: rates.some(rate => rate.id === state.selectedShipping) ? state.selectedShipping : newSelectedShipping, };
        case 'UPDATE_TOTALS':
            if (!state.cartData) return state;
            return { ...state, cartData: { ...state.cartData, shippingTotal: action.payload.shippingTotal, total: action.payload.total, }, };
        default: 
            return state;
    }
}
function isApolloError(error: unknown): boolean { return (typeof error === 'object' && error !== null && 'graphQLErrors' in error); }
const getErrorMessage = (error: unknown): string => { if (isApolloError(error) && Array.isArray((error as any).graphQLErrors) && (error as any).graphQLErrors.length > 0) { return (error as any).graphQLErrors[0].message; } if (error instanceof Error) { return error.message.replace(/<[^>]*>?/gm, ''); } return 'An unexpected error occurred.'; };


// ★★★ Stripe Context সহ মূল ক্লায়েন্ট কম্পোনেন্ট ★★★
function CheckoutClientComponent({ paymentGateways }: { paymentGateways: PaymentGateway[] }) {
  const router = useRouter();
  const { cartItems, loading: isCartContextLoading, clearCart } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const { customerInfo, shippingRates, selectedShipping, selectedPaymentMethod, cartData, orderNotes, addressInputStarted, loading } = state;

  const customerInfoRef = useRef(customerInfo);
  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);

  // Stripe হুকগুলো এখানে ব্যবহার করা হবে
  const stripe = useStripe();
  const elements = useElements();

  const refetchCartData = useCallback(async () => { dispatch({ type: 'SET_LOADING', key: 'cart', payload: true }); try { const { data } = await client.query<{ cart: CartData }>({ query: GET_CHECKOUT_DATA, fetchPolicy: 'network-only' }); if (data?.cart) { dispatch({ type: 'SET_CHECKOUT_DATA', payload: { cart: data.cart } }); } } catch (err) { toast.error('Could not refresh cart data.'); } finally { dispatch({ type: 'SET_LOADING', key: 'cart', payload: false }); } }, []);
  useEffect(() => { if (!isCartContextLoading && cartItems.length === 0) router.push('/cart'); else refetchCartData(); }, [isCartContextLoading, cartItems.length, router, refetchCartData]);
  const handleAddressChange = useCallback(async (address: Partial<ShippingFormData>) => { dispatch({ type: 'SET_FIELD', field: 'customerInfo', payload: address }); if (!addressInputStarted) dispatch({ type: 'SET_FIELD', field: 'addressInputStarted', payload: true }); const updatedCustomerInfo = { ...customerInfoRef.current, ...address }; if (updatedCustomerInfo.city && updatedCustomerInfo.postcode && updatedCustomerInfo.state) { dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true }); try { await client.mutate({ mutation: UPDATE_CUSTOMER_MUTATION, variables: { input: { shipping: updatedCustomerInfo, billing: updatedCustomerInfo } } }); await refetchCartData(); } catch (err) { toast.error('Could not calculate shipping.'); } finally { dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false }); } } }, [addressInputStarted, refetchCartData]);
  const handleApplyCoupon = async (couponCode: string) => { dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: true }); toast.loading('Applying coupon...'); try { await client.mutate({ mutation: APPLY_COUPON_MUTATION, variables: { input: { code: couponCode } } }); await refetchCartData(); toast.dismiss(); toast.success('Coupon applied!'); } catch (error) { toast.dismiss(); toast.error(getErrorMessage(error)); } finally { dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: false }); } };
  const handleRemoveCoupon = async (couponCode: string) => { if (loading.removingCoupon) return; dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: true }); toast.loading('Removing coupon...'); try { await client.mutate({ mutation: REMOVE_COUPON_MUTATION, variables: { input: { codes: [couponCode] } } }); await refetchCartData(); toast.dismiss(); toast.success('Coupon removed.'); } catch (error) { toast.dismiss(); toast.error(getErrorMessage(error)); } finally { dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: false }); } };
  const handleShippingSelect = (rateId: string) => { dispatch({ type: 'SET_FIELD', field: 'selectedShipping', payload: rateId }); const selectedRate = shippingRates.find(rate => rate.id === rateId); if (cartData && selectedRate) { const subtotal = parseFloat(cartData.subtotal.replace(/[^0-9.]/g, '')) || 0; const discount = parseFloat(cartData.discountTotal.replace(/[^0-9.]/g, '')) || 0; const shippingCost = parseFloat(selectedRate.cost) || 0; const newTotal = (subtotal - discount) + shippingCost; dispatch({ type: 'UPDATE_TOTALS', payload: { shippingTotal: `$${shippingCost.toFixed(2)}`, total: `$${newTotal.toFixed(2)}` } }); } client.mutate({ mutation: UPDATE_SHIPPING_METHOD_MUTATION, variables: { input: { shippingMethods: [rateId] } }, }).catch(err => { console.error("Failed to sync shipping method with server:", err); toast.error("Could not save shipping preference."); }); };
  
  // ★★★ আপনার পরিকল্পনা অনুযায়ী আপডেট করা handlePlaceOrder ফাংশন ★★★
  const handlePlaceOrder = async (paymentData?: { transaction_id?: string; }) => {
    if (!selectedShipping) { toast.error("Please select a shipping method."); return; }
    if (!customerInfoRef.current.firstName || !customerInfoRef.current.email) { toast.error("Please fill in all required shipping details."); return; }

    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });

    // --- Stripe পেমেন্টের জন্য নতুন লজিক ---
    if (selectedPaymentMethod.includes('stripe') || selectedPaymentMethod.includes('klarna') || selectedPaymentMethod.includes('afterpay')) {
        if (!stripe || !elements) {
            toast.error("Stripe is not ready yet.");
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
            return;
        }

        // ধাপ ১: PaymentElement-এর ভেতর থেকে তথ্য সংগ্রহ করা
        const { error: submitError } = await elements.submit();
        if (submitError) {
            toast.error(submitError.message || "Please check your details.");
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: 'YOUR_CLIENT_SECRET', // এটি PaymentMethods কম্পোনেন্ট থেকে পেতে হবে
            confirmParams: {
                return_url: `${window.location.origin}/order-success`,
            },
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                toast.error(error.message || "Please check your details.");
            } else {
                toast.error("An unexpected error occurred with payment.");
            }
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
        }
        // Stripe রিডাইরেক্ট পরিচালনা করবে, তাই এখানে আর কিছু করার নেই
        return; 
    }
    
    // --- PayPal এবং অফলাইন পেমেন্টের জন্য আপনার আগের লজিক (অপরিবর্তিত) ---
    const customerDetails = {
      first_name: customerInfoRef.current.firstName,
      last_name: customerInfoRef.current.lastName,
      address_1: customerInfoRef.current.address1,
      city: customerInfoRef.current.city,
      state: customerInfoRef.current.state,
      postcode: customerInfoRef.current.postcode,
      email: customerInfoRef.current.email,
      phone: customerInfoRef.current.phone,
    };
    const couponLines = cartData?.appliedCoupons?.map(coupon => ({ code: coupon.code })) || [];
    const orderPayload = {
      payment_method: selectedPaymentMethod,
      payment_method_title: paymentGateways.find(g => g.id === selectedPaymentMethod)?.title || selectedPaymentMethod,
      set_paid: !!paymentData?.transaction_id,
      billing: customerDetails,
      shipping: customerDetails,
      line_items: cartItems.map(item => ({ product_id: item.databaseId, quantity: item.quantity })),
      shipping_lines: [{ method_id: selectedShipping, method_title: shippingRates.find(rate => rate.id === selectedShipping)?.label || 'Shipping', total: cartData?.shippingTotal?.replace(/[^0-9.]/g, '') || '0' }],
      coupon_lines: couponLines,
      customer_note: orderNotes,
      transaction_id: paymentData?.transaction_id || '',
      status: (['cod', 'cheque', 'bacs'].includes(selectedPaymentMethod)) ? 'on-hold' : 'pending',
    };
    const result = await createOrderWithRestApi(orderPayload);
    if (result.success && result.order) {
      toast.dismiss();
      toast.success('Order placed successfully!');
      router.push(`/order-success?order_id=${result.order.id}&key=${result.order.orderKey}`);
      if (typeof clearCart === 'function') await clearCart();
    } else {
      toast.dismiss();
      toast.error(result.message || 'Failed to place order.');
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
        <OrderSummary 
          cartItems={cartItems}
          cartData={cartData}
          onRemoveCoupon={handleRemoveCoupon}
          isRemovingCoupon={loading.removingCoupon}
          onApplyCoupon={handleApplyCoupon}
          isApplyingCoupon={loading.applyingCoupon}
          rates={shippingRates}
          selectedRateId={selectedShipping}
          onRateSelect={handleShippingSelect}
          isLoadingShipping={loading.shipping}
          addressEntered={addressInputStarted}
        />
        <PaymentMethods 
          gateways={paymentGateways}
          selectedPaymentMethod={selectedPaymentMethod} 
          onPaymentMethodChange={(method) => dispatch({ type: 'SET_FIELD', field: 'selectedPaymentMethod', payload: method })} 
          onPlaceOrder={handlePlaceOrder} 
          isPlacingOrder={loading.order} 
          total={total} 
          isShippingSelected={!!selectedShipping} 
          customerInfo={customerInfoRef.current}
        />
      </div>
    </div>
  );
}

// ★★★ Stripe Elements Provider দিয়ে মূল কম্পোনেন্টকে র‍্যাপ করা ★★★
export default function CheckoutClient(props: { paymentGateways: PaymentGateway[] }) {
    const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
        ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
        : null;

    if (!stripePromise) {
        return <div className={styles.pageLoader}>Loading Payment Gateway...</div>;
    }
    
    return (
        <Elements stripe={stripePromise} options={{}}>
            <CheckoutClientComponent {...props} />
        </Elements>
    );
}