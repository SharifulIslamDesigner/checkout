//app/checkout/components/CheckoutClient.tsx

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useCallback, useReducer, useRef, useState } from 'react';
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
interface GraphQLError {
  message: string;
  [key: string]: unknown; // অন্যান্য প্রপার্টি থাকতে পারে
}

interface ApolloErrorLike {
  graphQLErrors: unknown;
}
interface ShippingFormData { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface ShippingRate { id: string; label: string; cost: string; }
interface AppliedCoupon { code: string; }
interface CartData { subtotal: string; total: string; shippingTotal: string; discountTotal: string; appliedCoupons: AppliedCoupon[] | null; availableShippingMethods?: { rates: ShippingRate[] }[] | null }
interface PaymentGateway { id: string; title: string; description: string; }
interface CheckoutMutationResult {
  checkout: {
    result: 'success' | 'failure';
    order: {
      databaseId: number;
      orderKey: string;
    } | null;
  } | null;
}
const GET_CHECKOUT_DATA = gql` query GetCheckoutData { cart { subtotal(format: FORMATTED) total(format: FORMATTED) shippingTotal(format: FORMATTED) discountTotal(format: FORMATTED) appliedCoupons { code } availableShippingMethods { rates { id label cost } } } } `;
const APPLY_COUPON_MUTATION = gql` mutation ApplyCoupon($input: ApplyCouponInput!) { applyCoupon(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const REMOVE_COUPON_MUTATION = gql` mutation RemoveCoupons($input: RemoveCouponsInput!) { removeCoupons(input: $input) { cart { total subtotal discountTotal appliedCoupons { code } } } } `;
const UPDATE_CUSTOMER_MUTATION = gql`mutation UpdateCustomerForCheckout($input: UpdateCustomerInput!) { updateCustomer(input: $input) { customer { id } } }`;
const UPDATE_SHIPPING_METHOD_MUTATION = gql`mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { cart { total } } }`;

// ★ নতুন সংযোজন: GraphQL দিয়ে অর্ডার তৈরির জন্য Checkout মিউটেশন
const CHECKOUT_MUTATION = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        databaseId
        orderKey
        status
      }
    }
  }
`;

type State = { 
  customerInfo: Partial<ShippingFormData>; 
  shippingRates: ShippingRate[]; 
  selectedShipping: string; 
  selectedPaymentMethod: string; 
  cartData: CartData | null; 
  orderNotes: string; 
  addressInputStarted: boolean; 
  shipToDifferentAddress: boolean;
  shippingInfo: Partial<ShippingFormData>;
  loading: { cart: boolean; shipping: boolean; applyingCoupon: boolean; removingCoupon: boolean; order: boolean; }; 
};

// ★★★ পরিবর্তন: Action টাইপকে আরও সুনির্দিষ্ট করা হয়েছে ★★★
type Action = 
  | { type: 'SET_CUSTOMER_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SHIPPING_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SELECTED_SHIPPING'; payload: string }
  | { type: 'SET_SELECTED_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'SET_ADDRESS_INPUT_STARTED'; payload: boolean }
  | { type: 'SET_SHIP_TO_DIFFERENT_ADDRESS'; payload: boolean }
  | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean } 
  | { type: 'SET_CHECKOUT_DATA'; payload: { cart: CartData } } 
  | { type: 'UPDATE_TOTALS'; payload: { shippingTotal: string; total: string } };

const initialState: State = { 
  customerInfo: {}, 
  shippingRates: [], 
  selectedShipping: '', 
  selectedPaymentMethod: 'ppcp-gateway', 
  cartData: null, 
  orderNotes: '', 
  addressInputStarted: false, 
  shipToDifferentAddress: false,
  shippingInfo: {},
  loading: { cart: true, shipping: false, applyingCoupon: false, removingCoupon: false, order: false }, 
};


function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CUSTOMER_INFO':
            return { ...state, customerInfo: { ...state.customerInfo, ...action.payload } };
        case 'SET_SHIPPING_INFO':
            return { ...state, shippingInfo: { ...state.shippingInfo, ...action.payload } };
        case 'SET_SELECTED_SHIPPING':
            return { ...state, selectedShipping: action.payload };
        case 'SET_SELECTED_PAYMENT_METHOD':
            return { ...state, selectedPaymentMethod: action.payload };
        case 'SET_ORDER_NOTES':
            return { ...state, orderNotes: action.payload };
        case 'SET_ADDRESS_INPUT_STARTED':
            return { ...state, addressInputStarted: action.payload };
        case 'SET_SHIP_TO_DIFFERENT_ADDRESS':
            return { ...state, shipToDifferentAddress: action.payload };
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
const getErrorMessage = (error: unknown): string => { 
  if (isApolloError(error)) {
    const graphQLErrors = (error as ApolloErrorLike).graphQLErrors;
    if (
      Array.isArray(graphQLErrors) && 
      graphQLErrors.length > 0 &&
      typeof graphQLErrors[0] === 'object' &&
      graphQLErrors[0] !== null &&
      'message' in graphQLErrors[0] &&
      typeof (graphQLErrors[0] as GraphQLError).message === 'string'
    ) {
      return (graphQLErrors[0] as GraphQLError).message;
    }
  }
  
  if (error instanceof Error) { 
    return error.message.replace(/<[^>]*>?/gm, ''); 
  } 
  
  return 'An unexpected error occurred.'; 
};


// ★★★ Stripe Context সহ মূল ক্লায়েন্ট কম্পোনেন্ট ★★★
function CheckoutClientComponent({ paymentGateways }: { paymentGateways: PaymentGateway[] }) {
  const router = useRouter();
  const { cartItems, loading: isCartContextLoading, clearCart } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const { customerInfo, shippingRates, selectedShipping, selectedPaymentMethod, cartData, orderNotes, addressInputStarted, loading, shipToDifferentAddress, shippingInfo } = state;

  const customerInfoRef = useRef(customerInfo);
  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);

  const shippingInfoRef = useRef(shippingInfo);
  useEffect(() => { shippingInfoRef.current = shippingInfo; }, [shippingInfo]);

  /*---
  const stripe = useStripe();
  const elements = useElements(); --*/

  const refetchCartData = useCallback(async () => { dispatch({ type: 'SET_LOADING', key: 'cart', payload: true }); try { const { data } = await client.query<{ cart: CartData }>({ query: GET_CHECKOUT_DATA, fetchPolicy: 'network-only' }); if (data?.cart) { dispatch({ type: 'SET_CHECKOUT_DATA', payload: { cart: data.cart } }); } } catch (err) {console.error("Error updating customer address:", err); toast.error('Could not refresh cart data.'); } finally { dispatch({ type: 'SET_LOADING', key: 'cart', payload: false }); } }, []);
  useEffect(() => { if (!isCartContextLoading && cartItems.length === 0) router.push('/cart'); else refetchCartData(); }, [isCartContextLoading, cartItems.length, router, refetchCartData]);
  const handleAddressChange = useCallback(async (address: Partial<ShippingFormData>) => { dispatch({ type: 'SET_CUSTOMER_INFO', payload: address }); if (!addressInputStarted) { dispatch({ type: 'SET_ADDRESS_INPUT_STARTED', payload: true });} const updatedCustomerInfo = { ...customerInfoRef.current, ...address }; if (updatedCustomerInfo.city && updatedCustomerInfo.postcode && updatedCustomerInfo.state) { dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true }); try { await client.mutate({ mutation: UPDATE_CUSTOMER_MUTATION, variables: { input: { shipping: updatedCustomerInfo, billing: updatedCustomerInfo } } }); await refetchCartData(); } catch (err) {  console.error("Error refetching cart data:", err); toast.error('Could not calculate shipping.'); } finally { dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false }); } } }, [addressInputStarted, refetchCartData]);
  const handleApplyCoupon = async (couponCode: string) => { dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: true }); toast.loading('Applying coupon...'); try { await client.mutate({ mutation: APPLY_COUPON_MUTATION, variables: { input: { code: couponCode } } }); await refetchCartData(); toast.dismiss(); toast.success('Coupon applied!'); } catch (error) { toast.dismiss(); toast.error(getErrorMessage(error)); } finally { dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: false }); } };
  const handleRemoveCoupon = async (couponCode: string) => { if (loading.removingCoupon) return; dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: true }); toast.loading('Removing coupon...'); try { await client.mutate({ mutation: REMOVE_COUPON_MUTATION, variables: { input: { codes: [couponCode] } } }); await refetchCartData(); toast.dismiss(); toast.success('Coupon removed.'); } catch (error) { toast.dismiss(); toast.error(getErrorMessage(error)); } finally { dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: false }); } };
  const handleShippingSelect = (rateId: string) => {  dispatch({ type: 'SET_SELECTED_SHIPPING', payload: rateId }); const selectedRate = shippingRates.find(rate => rate.id === rateId); if (cartData && selectedRate) { const subtotal = parseFloat(cartData.subtotal.replace(/[^0-9.]/g, '')) || 0; const discount = parseFloat(cartData.discountTotal.replace(/[^0-9.]/g, '')) || 0; const shippingCost = parseFloat(selectedRate.cost) || 0; const newTotal = (subtotal - discount) + shippingCost; dispatch({ type: 'UPDATE_TOTALS', payload: { shippingTotal: `$${shippingCost.toFixed(2)}`, total: `$${newTotal.toFixed(2)}` } }); } client.mutate({ mutation: UPDATE_SHIPPING_METHOD_MUTATION, variables: { input: { shippingMethods: [rateId] } }, }).catch(err => { console.error("Failed to sync shipping method with server:", err); toast.error("Could not save shipping preference."); }); };
  
  const handleShippingAddressChange = useCallback((address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_SHIPPING_INFO', payload: address });
  }, []);

  // ★ পরিবর্তিত ফাংশন: REST API-এর পরিবর্তে GraphQL মিউটেশন ব্যবহার করা হয়েছে
  const handlePlaceOrder = async (paymentData?: { transaction_id?: string; shippingAddress?: Partial<ShippingFormData>; }) => {
    if (!selectedShipping) { toast.error("Please select a shipping method."); return; }

    const isBillingAddressValid = customerInfoRef.current.firstName && customerInfoRef.current.email;
    const isShippingAddressValid = !shipToDifferentAddress || (shippingInfoRef.current.firstName && shippingInfoRef.current.email);

    if (!paymentData?.shippingAddress && (!isBillingAddressValid || !isShippingAddressValid)) { 
        toast.error("Please fill in all required billing and shipping details."); 
        return; 
    }

    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });

    // --- Stripe পেমেন্টের লজিক অপরিবর্তিত ---
    /*if (selectedPaymentMethod.includes('stripe') || selectedPaymentMethod.includes('klarna') || selectedPaymentMethod.includes('afterpay')) {
        if (!stripe || !elements) {
            toast.error("Stripe is not ready yet.");
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
            return;
        }
        const { error: submitError } = await elements.submit();
        if (submitError) {
            toast.error(submitError.message || "Please check your details.");
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
            return;
        }
        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: 'YOUR_CLIENT_SECRET', 
            confirmParams: { return_url: `${window.location.origin}/order-success`, },
        });

        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                toast.error(error.message || "Please check your details.");
            } else {
                toast.error("An unexpected error occurred with payment.");
            }
            dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
        }
        return; 
    }*/
    
    // --- GraphQL ব্যবহার করে অর্ডার তৈরির নতুন লজিক ---
    try {
      const billingDetails = paymentData?.shippingAddress && paymentData.shippingAddress.address1
        ? {
            firstName: paymentData.shippingAddress.firstName || '',
            lastName: paymentData.shippingAddress.lastName || '',
            address1: paymentData.shippingAddress.address1 || '',
            city: paymentData.shippingAddress.city || '',
            state: paymentData.shippingAddress.state || '',
            postcode: paymentData.shippingAddress.postcode || '',
            email: paymentData.shippingAddress.email || customerInfoRef.current.email,
            phone: paymentData.shippingAddress.phone || customerInfoRef.current.phone,
        }
        : customerInfoRef.current;
      
      // ★ নতুন সংযোজন: শিপিং ঠিকানা নির্ধারণ
      const shippingDetails = shipToDifferentAddress ? shippingInfoRef.current : billingDetails;

      const mutationInput = {
        clientMutationId: `checkout-${Date.now()}`,
        billing: billingDetails,
        shipping: shippingDetails,
        paymentMethod: selectedPaymentMethod,
        shippingMethod: selectedShipping,
        customerNote: orderNotes,
        transactionId: paymentData?.transaction_id || '',
        isPaid: !!paymentData?.transaction_id,
      };

       const { data } = await client.mutate<CheckoutMutationResult>({
        mutation: CHECKOUT_MUTATION,
        variables: { input: mutationInput },
    });

      const checkoutData = data?.checkout;
      const result = {
        success: checkoutData?.result === 'success',
        order: {
          id: checkoutData?.order?.databaseId,
          orderKey: checkoutData?.order?.orderKey,
        },
        message: checkoutData?.result !== 'success' ? 'Failed to place order.' : undefined
      };

      if (result.success && result.order?.id) {
        toast.dismiss();
        toast.success('Order placed successfully!');
        router.push(`/order-success?order_id=${result.order.id}&key=${result.order.orderKey}`);
        if (typeof clearCart === 'function') await clearCart();
      } else {
        toast.dismiss();
        toast.error(result.message || 'Failed to place order.');
        dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
      }
    } catch (error) {
      toast.dismiss();
      toast.error(getErrorMessage(error));
      dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
    }
  };

  const total = cartData?.total ? parseFloat(cartData.total.replace(/[^0-9.]/g, '')) : 0;
  if (loading.cart && !cartData) { return ( <div className={styles.pageLoader}><h1 className={styles.loaderTitle}>Checkout</h1></div> ); }

  return (
    <div className={styles.checkoutLayout}>
      <div className={styles.leftColumn}>
        <ShippingForm
            // ★★★ পরিবর্তন: শিরোনামটি এখন শর্তসাপেক্ষ (Conditional) ★★★
            title={shipToDifferentAddress ? "Billing Details" : "Billing & Shipping Details"}
            onAddressChange={handleAddressChange}
            defaultValues={customerInfo}
        />
        
        <div className={styles.checkboxContainer}>
            <label htmlFor="ship-to-different-address">
                <input
                    type="checkbox"
                    id="ship-to-different-address"
                    checked={shipToDifferentAddress}
                    onChange={(e) => dispatch({ type: 'SET_SHIP_TO_DIFFERENT_ADDRESS', payload: e.target.checked })}
                />
                <span>Ship to a different address?</span>
            </label>
        </div>

        {shipToDifferentAddress && (
            <div className={styles.differentShippingSection}>
                <ShippingForm
                    title="Shipping Details"
                    onAddressChange={handleShippingAddressChange}
                    defaultValues={shippingInfo}
                />
            </div>
        )}

        <OrderNotes notes={orderNotes} onNotesChange={(notes) => dispatch({ type: 'SET_ORDER_NOTES', payload: notes })} />
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
          onPaymentMethodChange={(method) => dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: method })} 
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
    const [stripePromise] = useState(() => 
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
            ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
            : null
    );
    if (!stripePromise) {
        return <div className={styles.pageLoader}>Loading Payment Gateway...</div>;
    }
    
    return (
        <Elements stripe={stripePromise} options={{}}>
            <CheckoutClientComponent {...props} />
        </Elements>
    );
}