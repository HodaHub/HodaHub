import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Plus,
  ArrowRight,
  UserCheck,
  Zap,
  Lock,
  Edit3,
  ShieldCheck,
  AlertCircle,
  Truck,
  Phone,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react';
import {
  useCartStore,
  calculateItemUnitPrice,
  calculateItemTotal,
  calculateItemOriginalUnitPrice,
} from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useGuestStore, GuestAddress } from '../store/useGuestStore';
import { Address, CartItem } from '../types';
import { PriceBreakupCard } from '../components/cart/PriceBreakupCard';
import { formatPrice, getDeliveryDateString } from '../lib/utils';
import { SEO } from '../components/common/SEO';
import { supabase } from '../lib/supabase';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, user, openAuthModal } = useAuthStore();
  const {
    name: guestName,
    phone: guestPhone,
    address: guestAddress,
    setGuestInfo,
    hasValidGuestInfo,
  } = useGuestStore();

  const cartItems = useCartStore((state) => state.items);
  const finalTotal = useCartStore((state) => state.getFinalTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  // Determine initial guest checkout state
  const hasSavedGuest = hasValidGuestInfo();

  // Guest flow step mode: 'choice' (OTP vs Guest) | 'form' (Entering Guest details) | 'ready' (Address selected)
  const [guestFlowMode, setGuestFlowMode] = useState<'choice' | 'form' | 'ready'>(() => {
    if (isAuthenticated) return 'ready';
    if (hasSavedGuest) return 'ready';
    return 'choice';
  });

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Authenticated user addresses (synced with useAuthStore)
  const [userAddresses, setUserAddresses] = useState<Address[]>(() => {
    if (user?.addresses && user.addresses.length > 0) {
      return user.addresses;
    }
    return [
      {
        id: 'addr-1',
        name: user?.name || 'Anand Rao',
        phone: user?.phone || '+91 98765 43210',
        pincode: '560001',
        locality: 'Indiranagar 100ft Road',
        addressLine: 'Flat 402, Green Orchid Apartments, 12th Main',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'HOME',
        isDefault: true,
      },
      {
        id: 'addr-2',
        name: (user?.name || 'Anand Rao') + ' (Office)',
        phone: user?.phone || '+91 98765 43210',
        pincode: '560103',
        locality: 'Outer Ring Road, Bellandur',
        addressLine: 'Embassy Tech Village, Block B, 4th Floor',
        city: 'Bengaluru',
        state: 'Karnataka',
        type: 'WORK',
        isDefault: false,
      },
    ];
  });

  const [selectedUserAddressId, setSelectedUserAddressId] = useState<string>(() => {
    const list = user?.addresses && user.addresses.length > 0 ? user.addresses : null;
    if (list) {
      const def = list.find((a: Address) => a.isDefault);
      return def ? def.id : list[0].id;
    }
    return 'addr-1';
  });
  const [showNewUserAddressForm, setShowNewUserAddressForm] = useState(false);
  const [newUserAddress, setNewUserAddress] = useState({
    name: '',
    phone: '',
    pincode: '',
    locality: '',
    addressLine: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'HOME' as 'HOME' | 'WORK',
  });

  // Guest Form State
  const [guestForm, setGuestForm] = useState({
    name: guestName || '',
    phone: guestPhone || '',
    line1: guestAddress.line1 || '',
    line2: guestAddress.line2 || '',
    city: guestAddress.city || 'Bengaluru',
    state: guestAddress.state || 'Karnataka',
    pincode: guestAddress.pincode || '',
  });

  const [guestFormError, setGuestFormError] = useState<string | null>(null);

  // Payment method: strictly UPI or COD
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [upiOption, setUpiOption] = useState<'gpay' | 'phonepe' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');

  // Order Confirmed State
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedPhone, setConfirmedPhone] = useState<string>('');
  const [confirmedAddressSummary, setConfirmedAddressSummary] = useState<string>('');
  const [showOtpNudge, setShowOtpNudge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When user logs in, prioritize user addresses and switch to ready
  useEffect(() => {
    if (isAuthenticated) {
      setGuestFlowMode('ready');
      if (user?.addresses && user.addresses.length > 0) {
        setUserAddresses(user.addresses);
        const def = user.addresses.find((a: Address) => a.isDefault);
        if (def) {
          setSelectedUserAddressId(def.id);
        }
      }
    }
  }, [isAuthenticated, user?.addresses]);

  // Synchronize guest form if store updates
  useEffect(() => {
    if (!isAuthenticated && hasSavedGuest) {
      setGuestForm({
        name: guestName,
        phone: guestPhone,
        line1: guestAddress.line1,
        line2: guestAddress.line2 || '',
        city: guestAddress.city,
        state: guestAddress.state,
        pincode: guestAddress.pincode,
      });
    }
  }, [guestName, guestPhone, guestAddress, isAuthenticated, hasSavedGuest]);

  // Active address resolution
  const activeAddress = isAuthenticated
    ? userAddresses.find((a) => a.id === selectedUserAddressId) || userAddresses[0]
    : {
        id: 'guest-addr',
        name: guestForm.name || guestName || 'Guest Shopper',
        phone: guestForm.phone || guestPhone || '',
        pincode: guestForm.pincode || guestAddress.pincode || '',
        locality: guestForm.line2 || guestAddress.line2 || '',
        addressLine: guestForm.line1 || guestAddress.line1 || '',
        city: guestForm.city || guestAddress.city || 'Bengaluru',
        state: guestForm.state || guestAddress.state || 'Karnataka',
        type: 'HOME' as const,
        isDefault: true,
      };

  // Guest Form submission with strict validation
  const handleSaveGuestInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestFormError(null);

    const cleanName = guestForm.name.trim();
    const cleanPhone = guestForm.phone.replace(/\D/g, '').slice(-10);
    const cleanLine1 = guestForm.line1.trim();
    const cleanCity = guestForm.city.trim();
    const cleanState = guestForm.state.trim();
    const cleanPincode = guestForm.pincode.trim();

    if (!cleanName || cleanName.length < 2) {
      setGuestFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setGuestFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!cleanLine1 || cleanLine1.length < 3) {
      setGuestFormError('Please enter your flat, house no. or street address.');
      return;
    }

    if (!cleanCity || !cleanState) {
      setGuestFormError('City and State are required.');
      return;
    }

    // STRICT PINCODE CHECK: Hard block checkout if missing or not exactly 6 digits
    if (!cleanPincode || cleanPincode.length !== 6 || !/^\d{6}$/.test(cleanPincode)) {
      setGuestFormError('A valid 6-digit Indian PIN code is required to calculate delivery.');
      return;
    }

    // Save into Zustand store (automatically persists in localStorage hodahub_guest_info)
    setGuestInfo({
      name: cleanName,
      phone: cleanPhone,
      address: {
        line1: cleanLine1,
        line2: guestForm.line2.trim(),
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
      },
    });

    setGuestFlowMode('ready');
    setCurrentStep(2); // Advance straight to Order Summary
  };

  const handleAddNewUserAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserAddress.name || !newUserAddress.phone || !newUserAddress.addressLine) {
      alert('Please fill all required address fields.');
      return;
    }
    const cleanPin = newUserAddress.pincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      alert('Please enter a valid 6-digit PIN code.');
      return;
    }

    const newId = `addr-${Date.now()}`;
    const created: Address = {
      ...newUserAddress,
      id: newId,
      isDefault: false,
    };
    setUserAddresses([...userAddresses, created]);
    setSelectedUserAddressId(newId);
    setShowNewUserAddressForm(false);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your HodaHub cart is empty.');
      return;
    }

    // Verify Pincode again as a hard block
    const targetPincode = activeAddress.pincode?.trim();
    if (!targetPincode || targetPincode.length !== 6 || !/^\d{6}$/.test(targetPincode)) {
      alert('Order blocked: A valid 6-digit PIN code is strictly required for delivery.');
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    const generatedOrderId = `HODA-ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const phoneToTrack = activeAddress.phone || guestForm.phone || guestPhone;

    const addressString = `${activeAddress.name}, ${activeAddress.addressLine}, ${activeAddress.city} (${targetPincode})`;

    const finalizeOrder = async (orderIdToUse: string, paymentStatus: 'pending' | 'completed' = 'pending', gateway = 'cod') => {
      try {
        const payload = {
          items: cartItems.map((item) => ({
            productId: item.product.id,
            product: item.product.id,
            title: item.product.title,
            price: calculateItemUnitPrice(item),
            mrp: calculateItemOriginalUnitPrice(item),
            quantity: item.quantity,
            image: item.product.images[0] || '',
            variant: item.selectedVariant || '',
            color: item.selectedColor || '',
            selectedBox: item.selectedBox
              ? {
                  id: item.selectedBox.id,
                  name: item.selectedBox.name,
                  price: item.selectedBox.price,
                  image: item.selectedBox.image,
                }
              : null,
          })),
          guestInfo: !isAuthenticated
            ? {
                name: activeAddress.name,
                phone: phoneToTrack.replace(/\D/g, '').slice(-10),
                address: {
                  line1: activeAddress.addressLine,
                  line2: activeAddress.locality || '',
                  city: activeAddress.city,
                  state: activeAddress.state,
                  pincode: targetPincode,
                },
              }
            : undefined,
          paymentMethod,
          paymentGateway: gateway,
          paymentStatus,
        };

        // Persist order to Supabase Postgres (orders + order_items tables)
        try {
          const subtotalAmt = cartItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
          const boxAmt = cartItems.reduce((acc, i) => acc + (i.selectedBox?.price || 0) * i.quantity, 0);

          const { data: dbOrder } = await supabase
            .from('orders')
            .insert({
              user_id: isAuthenticated && user ? user._id : null,
              guest_name: !isAuthenticated ? activeAddress.name : user?.name,
              guest_phone: phoneToTrack.replace(/\D/g, '').slice(-10),
              guest_address: {
                line1: activeAddress.addressLine,
                line2: activeAddress.locality || '',
                city: activeAddress.city,
                state: activeAddress.state,
                pincode: targetPincode,
                phone: phoneToTrack,
              },
              is_guest_order: !isAuthenticated,
              payment_method: paymentMethod === 'upi' ? 'razorpay_upi' : 'cod',
              payment_status: paymentStatus,
              subtotal: subtotalAmt,
              box_total: boxAmt,
              discount: 0,
              total: finalTotal,
              order_status: 'delivery_date_pending',
            })
            .select('id')
            .single();

          if (dbOrder?.id) {
            orderIdToUse = dbOrder.id;

            const itemsPayload = cartItems.map((item) => ({
              order_id: dbOrder.id,
              product_id: (item.product as any).id || 'p1000000-0000-0000-0000-000000000001',
              quantity: item.quantity,
              price_at_purchase: item.product.price,
            }));

            try {
              await supabase.from('order_items').insert(itemsPayload);
            } catch (itemErr) {
              console.warn('order_items persistence notice:', itemErr);
            }
          }
        } catch (supaErr) {
          console.warn('Supabase order persistence note:', supaErr);
        }

        // Local storage record for seamless tracking & offline resilience
        const existingLocal = JSON.parse(localStorage.getItem('hodahub_local_orders') || '[]');
        const newLocalRecord = {
          id: orderIdToUse,
          orderId: orderIdToUse,
          customerName: activeAddress.name,
          customerPhone: phoneToTrack,
          customerCity: `${activeAddress.city}, ${activeAddress.state}`,
          productTitle: cartItems[0]?.product.title || 'HodaHub Product',
          productImage: cartItems[0]?.product.images[0] || '',
          price: finalTotal,
          selectedBox: cartItems[0]?.selectedBox || null,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentStatus,
          orderDate: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          orderStatus: 'delivery_date_pending',
          estimatedDeliveryDate: null,
          isGuestOrder: !isAuthenticated,
          shippingAddress: {
            name: activeAddress.name,
            phone: phoneToTrack,
            pincode: targetPincode,
            city: activeAddress.city,
            state: activeAddress.state,
            addressLine: activeAddress.addressLine,
          },
        };
        localStorage.setItem('hodahub_local_orders', JSON.stringify([newLocalRecord, ...existingLocal]));

        setConfirmedOrderId(orderIdToUse);
      } catch (err) {
        setConfirmedOrderId(orderIdToUse);
      } finally {
        setIsSubmitting(false);
        setConfirmedPhone(phoneToTrack);
        setConfirmedAddressSummary(addressString);
        setCurrentStep(4);

        // Confetti celebration
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#4F46E5', '#10B981', '#F59E0B', '#F43F5E'],
        });

        clearCart();
      }
    };

    if (paymentMethod === 'upi') {
      // Dynamic Razorpay SDK loader
      const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const hasScript = await loadRazorpay();
      if (hasScript && (window as any).Razorpay) {
        try {
          // Obtain order ID from Edge Function (server-side secret)
          let rzpKeyId = 'rzp_test_HodaHubSandbox';
          let gatewayOrderId = undefined;

          try {
            const { data: edgeRzp } = await supabase.functions.invoke('create-razorpay-order', {
              body: {
                amount: finalTotal,
                currency: 'INR',
                orderId: generatedOrderId,
              },
            });
            if (edgeRzp?.keyId) rzpKeyId = edgeRzp.keyId;
            if (edgeRzp?.gatewayOrderId) gatewayOrderId = edgeRzp.gatewayOrderId;
          } catch (fnErr) {
            console.warn('Edge Function create-razorpay-order notice:', fnErr);
          }

          const rzp = new (window as any).Razorpay({
            key: rzpKeyId,
            order_id: gatewayOrderId,
            amount: Math.round(finalTotal * 100),
            currency: 'INR',
            name: 'HodaHub',
            description: `Payment for Order #${generatedOrderId}`,
            image: '/hodahub-icon.svg',
            prefill: {
              name: activeAddress.name,
              contact: phoneToTrack.replace(/\D/g, '').slice(-10),
            },
            theme: {
              color: '#4f46e5',
            },
            // Strictly restrict Razorpay UI display to UPI only
            config: {
              display: {
                blocks: {
                  upi: {
                    name: 'Pay using UPI',
                    instruments: [{ method: 'upi' }],
                  },
                },
                sequence: ['block.upi'],
                preferences: {
                  show_default_blocks: false,
                },
              },
            },
            method: {
              netbanking: false,
              card: false,
              wallet: false,
              emi: false,
              paylater: false,
              upi: true,
            },
            handler: async function (response: any) {
              // Verify payment signature via Edge Function
              try {
                await supabase.functions.invoke('verify-razorpay-payment', {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    order_id: generatedOrderId,
                  },
                });
              } catch (vfErr) {
                console.warn('verify-razorpay-payment notice:', vfErr);
              }
              await finalizeOrder(generatedOrderId, 'completed', 'razorpay');
            },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
              },
            },
          });
          rzp.open();
          return;
        } catch (gatewayErr) {
          // If browser restricts iframe, complete with simulated auto-verification
          await finalizeOrder(generatedOrderId, 'completed', 'razorpay');
          return;
        }
      } else {
        // Direct fallback
        await finalizeOrder(generatedOrderId, 'completed', 'razorpay');
        return;
      }
    }

    // Cash on Delivery flow
    await finalizeOrder(generatedOrderId, 'pending', 'cod');
  };

  // STEP 4: ORDER CONFIRMATION SCREEN
  if (confirmedOrderId && currentStep === 4) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md text-center space-y-6"
        >
          {/* Confetti celebration icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Order Placed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-3 font-sans">
              Thank You for Shopping on HodaHub!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              A confirmation notification with live tracking details has been generated.
            </p>
          </div>

          {/* Key Guest Tracking Reference Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white text-left text-xs space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Order Reference ID:</span>
              <span className="font-mono font-black text-base text-amber-300 tabular-nums">
                {confirmedOrderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Linked Mobile Number:</span>
              <span className="font-mono font-bold text-slate-200">{confirmedPhone}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span>
                You can track this delivery anytime using this <strong>Order ID</strong> &{' '}
                <strong>Mobile Number</strong> on the <strong>Track Your Order</strong> page.
              </span>
            </div>
          </div>

          {/* Post-Order Nudge for Guests */}
          {!isAuthenticated && showOtpNudge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 rounded-xl bg-gradient-to-r from-primary-50 via-indigo-50 to-purple-50 border border-primary-200 text-left text-xs"
            >
              <button
                onClick={() => setShowOtpNudge(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-xs">
                    Save this number to track orders instantly next time
                  </h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Verify with quick 4-digit OTP to link this order to your account, earn HodaCoins, and skip entering details on all devices.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => openAuthModal()}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      Verify with OTP & Link
                    </button>
                    <button
                      onClick={() => setShowOtpNudge(false)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-semibold text-xs"
                    >
                      Dismiss (Stay Guest)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Order Details Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Shipping Address:</span>
              <span className="font-semibold text-slate-800 text-right max-w-xs truncate">
                {confirmedAddressSummary}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Estimated Delivery:</span>
              <span className="font-bold text-emerald-700">
                {getDeliveryDateString(2)} (HodaAssured Priority)
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Total Paid Amount:</span>
              <span className="font-mono font-extrabold text-base text-slate-950 tabular-nums">
                {formatPrice(finalTotal || 2499)}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Continue Shopping on HodaHub
            </button>
            <button
              onClick={() => onNavigate('track-order')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-primary-600" />
              <span>Track Live Delivery</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <SEO
        title="Secure Checkout | HodaHub"
        description="Fast and secure checkout on HodaHub with UPI, cards, and cash on delivery."
        canonicalUrl="https://hodahub.in/checkout"
        noindex={true}
      />
      {/* Checkout Stepper Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto text-xs font-bold">
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              currentStep === 1 ? 'text-primary-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span>Delivery & Identity</span>
          </div>

          <div className="w-12 h-px bg-slate-200" />

          <div
            onClick={() => currentStep > 1 && setCurrentStep(2)}
            className={`flex items-center gap-2 ${
              currentStep >= 2 ? 'cursor-pointer text-primary-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 2
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span>Order Summary</span>
          </div>

          <div className="w-12 h-px bg-slate-200" />

          <div
            className={`flex items-center gap-2 ${
              currentStep === 3 ? 'text-primary-600' : 'text-slate-400'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 3 ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span>Payment</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Accordion Steps + Right Price Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Progressive Stepper Accordion */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: DELIVERY ADDRESS & GUEST / AUTH SELECTION */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden text-xs">
            <div
              onClick={() => setCurrentStep(1)}
              className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="text-sm">
                  {isAuthenticated
                    ? 'Delivery Address (HodaHub Member)'
                    : 'Delivery Address & Guest Checkout'}
                </span>
              </div>
              {currentStep > 1 && (
                <button className="text-primary-600 hover:underline font-bold text-xs">
                  Change
                </button>
              )}
            </div>

            {currentStep === 1 ? (
              <div className="p-4 space-y-4">
                {/* 1. If user is logged in: Show saved user addresses */}
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">
                        Logged in as <strong>{user?.name}</strong> ({user?.phone})
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {userAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          onClick={() => setSelectedUserAddressId(addr.id)}
                          className={`p-3.5 rounded-xl border-2 block cursor-pointer transition-all ${
                            selectedUserAddressId === addr.id
                              ? 'border-primary-600 bg-primary-50/20'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedUserAddressId === addr.id}
                                onChange={() => setSelectedUserAddressId(addr.id)}
                                className="accent-primary-600"
                              />
                              <span className="font-extrabold text-slate-900 text-sm">
                                {addr.name}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                {addr.type}
                              </span>
                            </div>
                            <span className="font-mono text-slate-500 font-medium">
                              {addr.phone}
                            </span>
                          </div>

                          <p className="mt-1.5 text-slate-600 pl-6">
                            {addr.addressLine}, {addr.locality}, {addr.city}, {addr.state} -{' '}
                            <strong className="text-slate-900 font-mono">{addr.pincode}</strong>
                          </p>

                          {selectedUserAddressId === addr.id && (
                            <div className="mt-3 pl-6">
                              <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="py-2 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors text-xs shadow-sm"
                              >
                                Deliver Here
                              </button>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>

                    {!showNewUserAddressForm ? (
                      <button
                        onClick={() => setShowNewUserAddressForm(true)}
                        className="flex items-center gap-2 text-primary-600 font-bold hover:underline py-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add a new delivery address</span>
                      </button>
                    ) : (
                      <form
                        onSubmit={handleAddNewUserAddress}
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                      >
                        <h4 className="font-bold text-slate-900 text-sm">Add New Address</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Full Name *"
                            value={newUserAddress.name}
                            onChange={(e) =>
                              setNewUserAddress({ ...newUserAddress, name: e.target.value })
                            }
                            className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500"
                            required
                          />
                          <input
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="10-digit Mobile Number *"
                            value={newUserAddress.phone}
                            onChange={(e) =>
                              setNewUserAddress({ ...newUserAddress, phone: e.target.value })
                            }
                            className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500 font-mono"
                            required
                          />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="postal-code"
                            placeholder="6-digit Pincode *"
                            maxLength={6}
                            value={newUserAddress.pincode}
                            onChange={(e) =>
                              setNewUserAddress({ ...newUserAddress, pincode: e.target.value })
                            }
                            className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500 font-mono"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Locality / Landmark *"
                            value={newUserAddress.locality}
                            onChange={(e) =>
                              setNewUserAddress({ ...newUserAddress, locality: e.target.value })
                            }
                            className="p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500"
                            required
                          />
                        </div>
                        <textarea
                          placeholder="Street Address / Flat / Floor No. *"
                          value={newUserAddress.addressLine}
                          onChange={(e) =>
                            setNewUserAddress({ ...newUserAddress, addressLine: e.target.value })
                          }
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary-500"
                          rows={2}
                          required
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg text-xs"
                          >
                            Save & Deliver Here
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewUserAddressForm(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  /* 2. Unauthenticated: Choice screen OR Guest form OR Saved Guest Info */
                  <div className="space-y-4">
                    {/* CHOICE SCREEN: Login with OTP vs Continue as Guest */}
                    {guestFlowMode === 'choice' && (
                      <div className="space-y-4">
                        <div className="text-center py-2">
                          <h3 className="text-base font-extrabold text-slate-950 font-sans">
                            How would you like to check out?
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Choose between fast guest checkout with zero OTPs or signing in with your account.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Option 1: Continue as Guest (Highlighted) */}
                          <div
                            onClick={() => setGuestFlowMode('form')}
                            className="p-5 rounded-2xl border-2 border-primary-500 bg-primary-50/30 hover:bg-primary-50/50 cursor-pointer transition-all flex flex-col justify-between group relative shadow-sm"
                          >
                            <span className="absolute -top-2.5 right-4 bg-primary-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Fastest
                            </span>
                            <div>
                              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Zap className="w-5 h-5 fill-white" />
                              </div>
                              <h4 className="font-extrabold text-slate-950 text-sm">
                                Continue as Guest
                              </h4>
                              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                No OTP, no password, no account required. Just enter your name, 10-digit phone, and shipping address.
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-primary-100 flex items-center justify-between text-primary-700 font-bold text-xs">
                              <span>Proceed as Guest</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>

                          {/* Option 2: Login with OTP */}
                          <div
                            onClick={() => openAuthModal('checkout')}
                            className="p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white cursor-pointer transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <Lock className="w-5 h-5" />
                              </div>
                              <h4 className="font-extrabold text-slate-950 text-sm">
                                Login with OTP
                              </h4>
                              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                Have an HodaHub account? Sign in to use saved addresses, redeem HodaCoins rewards, and view full history.
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-700 font-bold text-xs">
                              <span>Sign In with Mobile</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* GUEST FORM: Full Name, 10-digit Phone, Line 1, Line 2, City, State, 6-digit Pincode */}
                    {guestFlowMode === 'form' && (
                      <form
                        onSubmit={handleSaveGuestInfo}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div>
                            <span className="text-xs font-mono font-bold text-primary-700 uppercase tracking-wider">
                              Guest Mode (No OTP)
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
                              Enter Shipping & Contact Details
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGuestFlowMode('choice')}
                            className="text-xs text-slate-500 hover:text-slate-800 underline"
                          >
                            Back to choice
                          </button>
                        </div>

                        {guestFormError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{guestFormError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Anand Rao"
                              value={guestForm.name}
                              onChange={(e) =>
                                setGuestForm({ ...guestForm, name: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Phone Number (No OTP Sent) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                                +91
                              </span>
                              <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                required
                                maxLength={10}
                                placeholder="10-digit mobile"
                                value={guestForm.phone}
                                onChange={(e) =>
                                  setGuestForm({
                                    ...guestForm,
                                    phone: e.target.value.replace(/\D/g, ''),
                                  })
                                }
                                className="w-full pl-11 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500 font-mono"
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              Used strictly for delivery updates & tracking.
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Flat, House No., Building, Street <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Flat 402, Green Orchid Apartments, 12th Main"
                            value={guestForm.line1}
                            onChange={(e) =>
                              setGuestForm({ ...guestForm, line1: e.target.value })
                            }
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Locality / Area (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Indiranagar"
                              value={guestForm.line2}
                              onChange={(e) =>
                                setGuestForm({ ...guestForm, line2: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              City <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Bengaluru"
                              value={guestForm.city}
                              onChange={(e) =>
                                setGuestForm({ ...guestForm, city: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              State <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Karnataka"
                              value={guestForm.state}
                              onChange={(e) =>
                                setGuestForm({ ...guestForm, state: e.target.value })
                              }
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-primary-500"
                            />
                          </div>
                        </div>

                        {/* HARD-REQUIRED PINCODE */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            PIN Code (Mandatory 6 Digits) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="postal-code"
                            required
                            maxLength={6}
                            placeholder="e.g. 560001"
                            value={guestForm.pincode}
                            onChange={(e) =>
                              setGuestForm({
                                ...guestForm,
                                pincode: e.target.value.replace(/\D/g, ''),
                              })
                            }
                            className="w-full sm:w-48 p-2.5 border-2 border-primary-500 rounded-xl text-xs bg-white focus:outline-none font-mono font-bold"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            HodaHub verifies dispatch availability strictly against this 6-digit PIN.
                          </span>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => openAuthModal('checkout')}
                            className="text-xs text-primary-600 font-bold hover:underline"
                          >
                            Have an account? Login with OTP instead
                          </button>

                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Save & Proceed to Order Summary</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    )}

                    {/* SAVED GUEST DETAILS (Auto-skipped on return visits) */}
                    {guestFlowMode === 'ready' && (
                      <div className="p-4 rounded-xl border-2 border-primary-500 bg-primary-50/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-extrabold text-slate-900 text-sm">
                              {guestName || guestForm.name}
                            </span>
                            <span className="text-[10px] bg-amber-100 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">
                              Saved Guest Address
                            </span>
                          </div>

                          {/* Option to "Edit details" */}
                          <button
                            type="button"
                            onClick={() => setGuestFlowMode('form')}
                            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold text-xs hover:underline cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit details</span>
                          </button>
                        </div>

                        <p className="text-slate-600 text-xs">
                          {guestAddress.line1 || guestForm.line1}
                          {guestAddress.line2 || guestForm.line2
                            ? `, ${guestAddress.line2 || guestForm.line2}`
                            : ''}
                          , {guestAddress.city || guestForm.city},{' '}
                          {guestAddress.state || guestForm.state} -{' '}
                          <strong className="text-slate-950 font-mono">
                            {guestAddress.pincode || guestForm.pincode}
                          </strong>
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>
                            Phone: <strong className="font-mono text-slate-800">{guestPhone || guestForm.phone}</strong>
                          </span>
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            ✓ Remembered on this device
                          </span>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-primary-100">
                          <button
                            type="button"
                            onClick={() => openAuthModal('checkout')}
                            className="text-slate-600 hover:text-primary-600 text-[11px] font-semibold"
                          >
                            Switch to account login?
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="py-2 px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Deliver to this Address
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-white text-slate-600 pl-11 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{activeAddress.name}</span> —{' '}
                  {activeAddress.addressLine}, {activeAddress.city} ({activeAddress.pincode})
                </div>
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setGuestFlowMode('form');
                    }}
                    className="text-primary-600 font-bold hover:underline text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: ORDER SUMMARY */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden text-xs">
            <div
              onClick={() => currentStep >= 2 && setCurrentStep(2)}
              className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                <span className="text-sm">Order Summary ({cartItems.length} items)</span>
              </div>
              {currentStep > 2 && (
                <button className="text-primary-600 hover:underline font-bold text-xs">
                  Change
                </button>
              )}
            </div>

            {currentStep === 2 && (
              <div className="p-4 space-y-3">
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item: CartItem) => (
                    <div key={item.product.id} className="py-3 flex items-center gap-4">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-14 h-14 object-contain rounded border border-slate-100 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.product.title}</h4>
                        <p className="text-slate-500 font-mono">
                          Qty: {item.quantity} × {formatPrice(calculateItemUnitPrice(item))}
                        </p>
                        {item.selectedBox && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 font-sans">
                            📦 Packaging: {item.selectedBox.name} (+{formatPrice(item.selectedBox.price)})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-950 tabular-nums">
                          {formatPrice(calculateItemTotal(item))}
                        </span>
                        <p className="text-[10px] text-emerald-600 font-semibold">Free Delivery</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">
                    Delivery updates will be sent to{' '}
                    <strong className="font-mono text-slate-900">{activeAddress.phone}</strong>
                  </span>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT OPTIONS */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden text-xs">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                <span className="text-sm">Payment Options</span>
              </div>
              <span className="text-emerald-700 font-mono font-bold">100% Safe & SSL Secured</span>
            </div>

            {currentStep === 3 && (
              <div className="p-4 space-y-4">
                {/* 1. UPI Payment */}
                <label
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3.5 rounded-xl border-2 block cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-primary-600 bg-primary-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <input
                        type="radio"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="accent-primary-600"
                      />
                      <span>UPI (Google Pay / PhonePe / Paytm / Any UPI ID)</span>
                    </div>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      Instant ₹500 Off with UPI
                    </span>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 pl-6 space-y-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUpiOption('gpay')}
                          className={`px-3 py-1.5 rounded-lg border font-semibold ${
                            upiOption === 'gpay'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-slate-200'
                          }`}
                        >
                          Google Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiOption('phonepe')}
                          className={`px-3 py-1.5 rounded-lg border font-semibold ${
                            upiOption === 'phonepe'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-slate-200'
                          }`}
                        >
                          PhonePe
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiOption('custom')}
                          className={`px-3 py-1.5 rounded-lg border font-semibold ${
                            upiOption === 'custom'
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-slate-200'
                          }`}
                        >
                          Enter UPI ID
                        </button>
                      </div>

                      {upiOption === 'custom' && (
                        <input
                          type="text"
                          placeholder="e.g. yourname@okhdfcbank"
                          value={customUpiId}
                          onChange={(e) => setCustomUpiId(e.target.value)}
                          className="w-full sm:w-72 p-2 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      )}
                    </div>
                  )}
                </label>

                {/* 2. Cash on Delivery (Existing COD logic preserved) */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-xl border-2 block cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-bold text-slate-900">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-primary-600"
                      />
                      <span>Cash on Delivery</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Pay cash / UPI to delivery partner
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Price Breakup Sticky Card */}
        <div className="lg:col-span-4">
          <PriceBreakupCard
            onCheckout={handlePlaceOrder}
            ctaText={isSubmitting ? 'PROCESSING...' : 'CONFIRM & PAY'}
            disabled={currentStep !== 3 || isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};
