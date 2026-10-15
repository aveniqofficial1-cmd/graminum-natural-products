import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Store,
  QrCode,
  Upload,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
  ArrowLeft,
  Info,
  MapPin,
  MessageCircle,
  FileCheck,
  Sparkles,
  X,
  User as UserIcon,
  Copy,
  Phone,
  AlertTriangle,
  AlertCircle,
  Check,
  Banknote,
  Smartphone,
  Home,
  CheckCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { DeliveryMethod, PaymentMethod, Address } from '../types';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, deliveryFee, grandTotal, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { currentUser, isAuthenticated, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { settings, getEffectiveQrUrl, generateWhatsAppOrderUrl } = useStoreSettings();
  const navigate = useNavigate();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Checkout Step: 1 = Delivery Method & Address, 2 = Payment & Place Order
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Delivery Method: Home Delivery (Online Delivery) vs Store Pickup
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Home Delivery');

  // Customer Contact & Shipping Form Data
  const defaultAddress = currentUser?.addresses?.find((a) => a.isDefault) || currentUser?.addresses?.[0];

  const [fullName, setFullName] = useState(defaultAddress?.fullName || currentUser?.name || '');
  const [email, setEmail] = useState(defaultAddress?.email || currentUser?.email || '');
  const [phone, setPhone] = useState(defaultAddress?.phone || currentUser?.phone || '');
  const [addressLine, setAddressLine] = useState(defaultAddress?.addressLine || '');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(defaultAddress?.city || 'Warangal');
  const [state, setState] = useState(defaultAddress?.state || 'Telangana');
  const [pincode, setPincode] = useState(defaultAddress?.pincode || '506002');
  const [deliveryNote, setDeliveryNote] = useState('');

  useEffect(() => {
    if (currentUser) {
      const addr = currentUser.addresses?.find((a) => a.isDefault) || currentUser.addresses?.[0];
      if (addr) {
        setFullName(addr.fullName || currentUser.name || '');
        setEmail(addr.email || currentUser.email || '');
        setPhone(addr.phone || currentUser.phone || '');
        if (addr.addressLine) setAddressLine(addr.addressLine);
        if (addr.city) setCity(addr.city);
        if (addr.state) setState(addr.state);
        if (addr.pincode) setPincode(addr.pincode);
      } else {
        setFullName(currentUser.name || '');
        setEmail(currentUser.email || '');
        setPhone(currentUser.phone || '');
      }
    }
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Payment Selection: Cash on Delivery vs Online UPI Transfer (9396723139)
  const [paymentChoice, setPaymentChoice] = useState<'cash' | 'online'>('online');
  const [paymentUtr, setPaymentUtr] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopyPhone = () => {
    const num = settings.whatsappNumber || '9396723139';
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    showToast(`Phone number copied to clipboard: ${num}`, 'success');
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const effectiveTotal = subtotal; // Free delivery for both online home delivery and store pickup
  const qrCodeUrl = getEffectiveQrUrl(effectiveTotal);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be below 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        showToast('Payment screenshot attached! It will be verified by our team.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      showToast('Please fill all required personal contact fields.', 'error');
      return;
    }

    if (deliveryMethod === 'Home Delivery') {
      if (!addressLine.trim() || !city.trim() || !pincode.trim()) {
        showToast('Please provide your complete doorstep delivery address.', 'error');
        return;
      }
    }

    setCheckoutStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      navigate('/shop');
      return;
    }

    setIsPlacingOrder(true);

    const shippingAddress: Address =
      deliveryMethod === 'Home Delivery'
        ? {
            id: `addr-${Date.now()}`,
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            addressLine: landmark.trim()
              ? `${addressLine.trim()} (Landmark: ${landmark.trim()})`
              : addressLine.trim(),
            city: city.trim(),
            state: state.trim() || 'Telangana',
            pincode: pincode.trim(),
            isDefault: true,
            type: 'Home',
          }
        : {
            id: `addr-${Date.now()}`,
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            addressLine:
              'Graminum Store Pickup: 11-18-356/3/A, Opp Sai Baba Temple, Beside Assisi School, O City, Kashibugga',
            city: 'Warangal',
            state: 'Telangana',
            pincode: '506002',
            isDefault: true,
            type: 'Work',
          };

    const finalPaymentMethod: PaymentMethod =
      paymentChoice === 'cash' ? 'Cash on Delivery' : 'UPI / QR Code';

    // The order must reach the shared store before the customer is told it exists.
    void (async () => {
      try {
        const newOrder = await createOrder({
          customerName: fullName.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          items: [...items],
          subtotal,
          deliveryFee: 0,
          discount: 0,
          grandTotal: effectiveTotal,
          deliveryMethod,
          shippingAddress,
          paymentMethod: finalPaymentMethod,
          paymentScreenshot: paymentChoice === 'online' ? receiptImage || undefined : undefined,
          paymentUtr: paymentChoice === 'online' ? paymentUtr.trim() || undefined : undefined,
        });

        clearCart();
        try {
          window.open(generateWhatsAppOrderUrl(newOrder), '_blank');
        } catch {
          // popup might be blocked
        }
        navigate(`/order-confirmation/${newOrder.orderNumber}`);
      } catch {
        showToast('Your order was not saved. Please check your connection and try again.', 'error');
      } finally {
        setIsPlacingOrder(false);
      }
    })();
  };

  // ================= UNAUTHENTICATED STATE: LOGIN / SIGNUP REQUIRED =================
  if (!isAuthenticated) {
    return (
      <div className="w-full bg-[#FBF8EF] min-h-[75vh] flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-[#EFF7E9] text-[#075B2A] rounded-3xl flex items-center justify-center mx-auto border border-[#8CCB55] shadow-xs">
            <Lock className="w-8 h-8 text-[#075B2A]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-[#4D963C] uppercase tracking-wider bg-[#EFF7E9] px-3 py-1 rounded-full border border-[#8CCB55]">
              Customer Login Required
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#075B2A] font-serif-title">
              Sign In to Complete Checkout
            </h1>
            <p className="text-xs sm:text-sm text-[#667267] leading-relaxed">
              Please sign in or create a Graminum account to select online home delivery or store pickup, choose your payment mode, and track your harvest order.
            </p>
          </div>

          {/* 1-Click Google Login */}
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-[#E1E9DC] hover:border-[#075B2A] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-xs active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E1E9DC] w-full"></div>
            <span className="bg-white px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
              Or with email
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/login?redirect=/checkout"
              className="w-full bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup?redirect=/checkout"
              className="w-full bg-[#EFF7E9] hover:bg-[#8CCB55]/30 text-[#075B2A] border border-[#8CCB55] text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full bg-[#FBF8EF] min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl border border-[#E1E9DC] text-center space-y-4 max-w-md shadow-sm">
          <p className="text-3xl">🧺</p>
          <h2 className="text-xl font-bold text-[#075B2A] font-serif-title">
            No Items to Checkout
          </h2>
          <p className="text-xs text-[#667267]">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-[#075B2A] text-white text-xs font-bold px-6 py-2.5 rounded-xl"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FBF8EF] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: 'Cart', link: '/cart' }, { label: 'Secure Checkout' }]} />

        {/* 3-Step Progress Indicator */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl border border-[#E1E9DC] shadow-xs">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {/* Step 1: Delivery & Address */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  checkoutStep >= 1
                    ? 'bg-[#075B2A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                1
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold ${
                  checkoutStep >= 1 ? 'text-[#075B2A]' : 'text-gray-400'
                }`}
              >
                Delivery & Address
              </span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-1.5 sm:mx-4 ${
                checkoutStep >= 2 ? 'bg-[#075B2A]' : 'bg-[#E1E9DC]'
              }`}
            ></div>

            {/* Step 2: Payment (Cash or Online) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  checkoutStep >= 2
                    ? 'bg-[#075B2A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold ${
                  checkoutStep >= 2 ? 'text-[#075B2A]' : 'text-gray-400'
                }`}
              >
                Cash / Online Payment
              </span>
            </div>

            <div className="flex-1 h-0.5 mx-1.5 sm:mx-4 bg-[#E1E9DC]"></div>

            {/* Step 3: Confirmation */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-400">
                Confirm
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ================= LEFT: STEP FORMS ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1: DELIVERY METHOD & CUSTOMER / SHIPPING DETAILS */}
            {checkoutStep === 1 && (
              <form
                onSubmit={handleContinueToPayment}
                className="bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-8 shadow-sm space-y-6"
              >
                {/* 1. Fulfillment Mode Selection: Online Delivery vs Store Pickup */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs sm:text-sm font-bold text-[#075B2A] uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#075B2A]" />
                      <span>1. Choose Delivery Method</span>
                    </h2>
                    <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      Free Shipping
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Online Doorstep Delivery */}
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Home Delivery')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        deliveryMethod === 'Home Delivery'
                          ? 'border-[#075B2A] bg-[#EFF7E9] shadow-sm'
                          : 'border-[#E1E9DC] bg-[#FBF8EF] hover:border-[#8CCB55]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              deliveryMethod === 'Home Delivery'
                                ? 'bg-[#075B2A] text-white'
                                : 'bg-white text-gray-600 border border-[#E1E9DC]'
                            }`}
                          >
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-black text-[#18251B]">
                              Online Home Delivery
                            </p>
                            <p className="text-[11px] text-[#4D963C] font-bold">
                              Doorstep Delivery
                            </p>
                          </div>
                        </div>

                        {deliveryMethod === 'Home Delivery' && (
                          <CheckCircle className="w-5 h-5 text-[#075B2A] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                        Delivered straight to your home address. Pay via Cash on Delivery or Online UPI.
                      </p>
                    </button>

                    {/* Option 2: Direct Store Pickup */}
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('Store Pickup')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        deliveryMethod === 'Store Pickup'
                          ? 'border-[#075B2A] bg-[#EFF7E9] shadow-sm'
                          : 'border-[#E1E9DC] bg-[#FBF8EF] hover:border-[#8CCB55]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              deliveryMethod === 'Store Pickup'
                                ? 'bg-[#075B2A] text-white'
                                : 'bg-white text-gray-600 border border-[#E1E9DC]'
                            }`}
                          >
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-black text-[#18251B]">
                              Direct Store Pickup
                            </p>
                            <p className="text-[11px] text-[#4D963C] font-bold">
                              Kashibugga, Warangal
                            </p>
                          </div>
                        </div>

                        {deliveryMethod === 'Store Pickup' && (
                          <CheckCircle className="w-5 h-5 text-[#075B2A] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                        Collect directly from Graminum Store counter in Warangal. 100% Free pickup.
                      </p>
                    </button>
                  </div>
                </div>

                {/* If Store Pickup is Selected: Show Store Details Card */}
                {deliveryMethod === 'Store Pickup' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#EFF7E9] border-2 border-[#8CCB55] space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#075B2A] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#075B2A] text-sm">
                            Graminum Herbal & Natural Store
                          </span>
                          <span className="text-[10px] bg-[#075B2A] text-white px-2 py-0.5 rounded font-bold">
                            Warangal
                          </span>
                        </div>
                        <p className="font-bold text-[#18251B]">
                          11-18-356/3/A, Opposite Sai Baba Temple, Beside Assisi School, O City
                        </p>
                        <p className="text-gray-600">
                          Kashibugga, Warangal, Telangana - 506002
                        </p>
                        <p className="text-[#075B2A] font-bold pt-1">
                          📞 Store Counter & Help: 9396723139
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#8CCB55]/50 flex items-center gap-2 text-[11px] text-gray-700">
                      <Clock className="w-4 h-4 text-[#075B2A] shrink-0" />
                      <span>
                        Pickup Hours: <strong>9:00 AM – 9:00 PM (Mon – Sun)</strong>. Order is prepared fresh at our store counter.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Customer Contact Details */}
                <div className="pt-4 border-t border-[#E1E9DC] space-y-4">
                  <h2 className="text-xs sm:text-sm font-bold text-[#075B2A] uppercase tracking-wider">
                    2. Customer Contact Coordinates
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#18251B] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Sravani Varma"
                        className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#18251B] mb-1">
                        Mobile Number (for Order Updates & WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98490 12345"
                        className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18251B] mb-1">
                      Email Address (for Digital Invoice) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sravani.varma@example.com"
                      className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                    />
                  </div>
                </div>

                {/* 3. Doorstep Delivery Address (Only shown for Home Delivery) */}
                {deliveryMethod === 'Home Delivery' && (
                  <div className="pt-4 border-t border-[#E1E9DC] space-y-4">
                    <h2 className="text-xs sm:text-sm font-bold text-[#075B2A] uppercase tracking-wider flex items-center gap-2">
                      <Home className="w-4 h-4 text-[#075B2A]" />
                      <span>3. Doorstep Delivery Address</span>
                    </h2>

                    <div>
                      <label className="block text-xs font-bold text-[#18251B] mb-1">
                        House / Flat No., Building & Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressLine}
                        onChange={(e) => setAddressLine(e.target.value)}
                        placeholder="e.g. Flat 302, Sri Nilayam, Beside Main Road"
                        className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#18251B] mb-1">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Sai Temple"
                          className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#18251B] mb-1">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Warangal"
                          className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#18251B] mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="e.g. 506002"
                          className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#18251B] mb-1">
                        Delivery Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        value={deliveryNote}
                        onChange={(e) => setDeliveryNote(e.target.value)}
                        placeholder="e.g. Ring the bell, deliver in morning hours"
                        className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                      />
                    </div>
                  </div>
                )}

                {/* Continue to Payment Button */}
                <div className="pt-4 border-t border-[#E1E9DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Link
                    to="/cart"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Cart</span>
                  </Link>

                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#075B2A] hover:bg-[#06451F] text-white py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer order-1 sm:order-2"
                  >
                    <span>Proceed to Payment (Cash / Online)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT METHOD (CASH OR ONLINE) & SUBMISSION */}
            {checkoutStep === 2 && (
              <form
                onSubmit={handlePlaceOrder}
                className="bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-8 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#4D963C] uppercase tracking-wider">
                      Step 2 of 2
                    </span>
                    <h2 className="text-sm sm:text-lg font-bold text-[#075B2A] font-serif-title">
                      Select Payment Option: Cash or Online
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="text-xs font-bold text-[#075B2A] hover:underline cursor-pointer"
                  >
                    Edit Delivery Info
                  </button>
                </div>

                {/* Payment Option Selector: Cash on Delivery vs Online Payment */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#18251B] uppercase tracking-wider">
                    Select Your Preferred Payment Method:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Cash on Delivery (Cash) */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('cash')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        paymentChoice === 'cash'
                          ? 'border-[#075B2A] bg-[#EFF7E9] shadow-sm'
                          : 'border-[#E1E9DC] bg-[#FBF8EF] hover:border-[#8CCB55]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              paymentChoice === 'cash'
                                ? 'bg-[#075B2A] text-white'
                                : 'bg-white text-gray-600 border border-[#E1E9DC]'
                            }`}
                          >
                            <Banknote className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-black text-[#18251B]">
                              {deliveryMethod === 'Home Delivery'
                                ? 'Cash on Delivery (Cash)'
                                : 'Pay at Store Counter (Cash)'}
                            </p>
                            <p className="text-[11px] text-[#4D963C] font-bold">
                              Pay in Cash
                            </p>
                          </div>
                        </div>

                        {paymentChoice === 'cash' && (
                          <CheckCircle className="w-5 h-5 text-[#075B2A] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                        {deliveryMethod === 'Home Delivery'
                          ? 'Pay in cash to our delivery executive when your natural products parcel arrives at your doorstep.'
                          : 'Pay in cash directly at the Graminum Kashibugga Warangal store counter during pickup.'}
                      </p>
                    </button>

                    {/* Option 2: Online Payment (Direct to 9396723139) */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('online')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        paymentChoice === 'online'
                          ? 'border-[#075B2A] bg-[#EFF7E9] shadow-sm'
                          : 'border-[#E1E9DC] bg-[#FBF8EF] hover:border-[#8CCB55]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              paymentChoice === 'online'
                                ? 'bg-[#075B2A] text-white'
                                : 'bg-white text-gray-600 border border-[#E1E9DC]'
                            }`}
                          >
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-black text-[#18251B]">
                              Online Phone / UPI Payment
                            </p>
                            <p className="text-[11px] text-[#4D963C] font-bold">
                              GPay / PhonePe / Paytm
                            </p>
                          </div>
                        </div>

                        {paymentChoice === 'online' && (
                          <CheckCircle className="w-5 h-5 text-[#075B2A] shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                        Instant direct phone payment to master number <strong>9396723139</strong> via GPay, PhonePe, or Paytm.
                      </p>
                    </button>
                  </div>
                </div>

                {/* IF CASH IS CHOSEN: Clear Summary Banner */}
                {paymentChoice === 'cash' && (
                  <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[#075B2A]" />
                      <span>Cash Payment Selected</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      You will pay <strong>₹{effectiveTotal}</strong> in cash{' '}
                      {deliveryMethod === 'Home Delivery'
                        ? 'to the delivery executive upon receiving your order at your doorstep.'
                        : 'at the store counter when you collect your order.'}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                      ✓ No advance payment required • Verified invoice generated on placement
                    </p>
                  </div>
                )}

                {/* IF ONLINE IS CHOSEN: DIRECT PHONE NUMBER PAYMENT BOX */}
                {paymentChoice === 'online' && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#EFF7E9] via-[#F4FAF0] to-[#E5F2DF] border-2 border-[#075B2A] space-y-5 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#075B2A] text-white flex items-center justify-center shadow-md shrink-0">
                          <Phone className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 bg-[#075B2A] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Online UPI / Mobile Payment</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-[#075B2A]">
                            Pay Directly via Phone Number
                          </h3>
                        </div>
                      </div>

                      <div className="bg-white px-4 py-2 rounded-2xl border border-[#8CCB55] shadow-xs text-right sm:text-right">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase">Total Payable</span>
                        <span className="text-lg sm:text-xl font-black text-[#075B2A]">₹{effectiveTotal}</span>
                      </div>
                    </div>

                    {/* Highlighted Master Mobile Number with 1-Click Copy */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#8CCB55] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center md:text-left">
                        <span className="text-[11px] font-extrabold text-[#4D963C] uppercase tracking-wider block">
                          Official Store Master Mobile Number:
                        </span>
                        <div className="flex items-center justify-center md:justify-start gap-3">
                          <span className="text-2xl sm:text-3xl font-black text-[#18251B] font-mono tracking-wider">
                            9396723139
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
                            Verified GPay / PhonePe / Paytm
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Merchant: <strong>{settings.merchantName}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className={`w-full md:w-auto px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                          copiedNumber
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#075B2A] hover:bg-[#06451F] text-white'
                        }`}
                      >
                        {copiedNumber ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied Number!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Mobile Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 3-Step Clear Payment Instructions */}
                    <div className="bg-white/80 p-4 rounded-2xl border border-[#E1E9DC] space-y-2.5">
                      <span className="text-[11px] font-bold text-[#18251B] uppercase tracking-wider block">
                        How to Pay in 3 Quick Steps:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                        <div className="bg-white p-3 rounded-xl border border-[#E1E9DC] flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#075B2A] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                            1
                          </span>
                          <div>
                            <strong className="block text-[#18251B]">Open UPI App</strong>
                            <span>Open Google Pay, PhonePe, Paytm, or BHIM.</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#E1E9DC] flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#075B2A] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                            2
                          </span>
                          <div>
                            <strong className="block text-[#18251B]">Pay to Mobile</strong>
                            <span>Enter number <strong>9396723139</strong> & pay <strong>₹{effectiveTotal}</strong>.</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#E1E9DC] flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#075B2A] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                            3
                          </span>
                          <div>
                            <strong className="block text-[#18251B]">Confirm on WhatsApp</strong>
                            <span>Click the green button below to submit & share receipt.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SCANNER DISABLED WARNING & BLURRED QR SCANNER */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/60 border-2 border-amber-300 space-y-4">
                      {/* Warning Notice Banner */}
                      <div className="flex items-start gap-3 bg-amber-100/90 p-3.5 rounded-2xl border border-amber-300 text-amber-900">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                            ⚠️ DO NOT USE QR SCANNER (Temporarily Disabled)
                          </h4>
                          <p className="text-[11px] sm:text-xs text-amber-900 mt-0.5 leading-relaxed">
                            Please <strong>do not scan the QR code</strong> below. Instead, please pay directly by transferring to the mobile number <strong>9396723139</strong> via Google Pay, PhonePe, or Paytm above.
                          </p>
                        </div>
                      </div>

                      {/* Blurred QR Code with Overlay */}
                      <div className="relative bg-white/70 p-4 rounded-2xl border border-amber-200 overflow-hidden">
                        <div className="filter blur-[5px] opacity-30 select-none pointer-events-none flex flex-col sm:flex-row items-center justify-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-xl border border-gray-300">
                            <img
                              src={qrCodeUrl}
                              alt="QR Disabled"
                              className="w-28 h-28 object-contain"
                            />
                          </div>
                          <div className="text-xs text-gray-500 space-y-1 text-center sm:text-left">
                            <p className="font-bold">UPI ID: {settings.upiId}</p>
                            <p>Merchant: {settings.merchantName}</p>
                            <p>Amount: ₹{effectiveTotal}</p>
                          </div>
                        </div>

                        {/* Overlay Label */}
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-900/10 backdrop-blur-[1px]">
                          <div className="bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 border border-white/40">
                            <AlertCircle className="w-4 h-4" />
                            <span>Scanner Disabled — Use Phone No: 9396723139</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Optional Payment Receipt Attachment on Checkout */}
                    <div className="bg-white p-4 rounded-2xl border border-[#E1E9DC] space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-[#18251B] flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-[#075B2A]" />
                          <span>Payment Screenshot / UTR (Optional)</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Speeds up admin approval
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Payment Screenshot:
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EFF7E9] file:text-[#075B2A] hover:file:bg-[#8CCB55]/30 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            12-Digit Bank UTR / Ref Number:
                          </label>
                          <input
                            type="text"
                            value={paymentUtr}
                            onChange={(e) => setPaymentUtr(e.target.value)}
                            placeholder="e.g. 402849102948"
                            className="w-full bg-[#FBF8EF] text-xs px-3 py-2 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                          />
                        </div>
                      </div>

                      {receiptImage && (
                        <div className="flex items-center gap-3 bg-[#EFF7E9] p-2.5 rounded-xl border border-[#8CCB55]">
                          <img
                            src={receiptImage}
                            alt="Attached Receipt Preview"
                            className="w-12 h-12 object-cover rounded-lg border bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#075B2A] text-xs">Screenshot Attached</p>
                            <p className="text-[10px] text-gray-500">Ready to submit with order</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReceiptImage('')}
                            className="text-red-500 hover:text-red-700 text-xs p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit & WhatsApp Sharing Info */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <MessageCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] sm:text-xs">
                    <strong>Auto-Filled WhatsApp Sharing:</strong> When you place this order, we will automatically pre-fill your order summary, item list, address, and amount into WhatsApp to our support team (<strong>{settings.whatsappNumber}</strong>). Our admin will verify your details and confirm your order immediately!
                  </p>
                </div>

                {/* Place Order Button */}
                <div className="pt-4 border-t border-[#E1E9DC] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Delivery Info</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#075B2A] hover:bg-[#06451F] disabled:opacity-50 text-white py-3.5 px-7 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-all active:scale-95 cursor-pointer order-1 sm:order-2"
                  >
                    {isPlacingOrder ? (
                      <span>Placing Order...</span>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {paymentChoice === 'cash'
                            ? 'Place Order with Cash'
                            : 'Place Order & Share on WhatsApp'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ================= RIGHT: ORDER SUMMARY SIDEBAR ================= */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-[#075B2A] uppercase tracking-wider pb-3 border-b border-[#E1E9DC] flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs text-[#4D963C] font-semibold">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h2>

              {/* Items Mini List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-[#E1E9DC] pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedPackSize}`}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-xl border shrink-0 bg-[#EFF7E9]"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#18251B] truncate">{item.product.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {item.selectedPackSize} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#075B2A] shrink-0">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="pt-3 border-t border-[#E1E9DC] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#667267]">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-[#18251B]">₹{subtotal}</span>
                </div>

                <div className="flex items-center justify-between text-[#667267]">
                  <span>
                    {deliveryMethod === 'Home Delivery' ? 'Online Home Delivery' : 'Direct Store Pickup'}
                  </span>
                  <span className="font-bold text-[#4D963C] uppercase">FREE</span>
                </div>

                <div className="flex items-center justify-between text-[#667267]">
                  <span>Payment Mode</span>
                  <span className="font-bold text-[#075B2A]">
                    {paymentChoice === 'cash'
                      ? 'Cash on Delivery (Cash)'
                      : 'Online Transfer (9396723139)'}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E1E9DC] flex items-center justify-between">
                  <span className="text-sm font-bold text-[#18251B]">Grand Total</span>
                  <span className="text-xl font-black text-[#075B2A]">₹{effectiveTotal}</span>
                </div>
              </div>

              {/* Delivery mode summary badge */}
              <div className="p-3 rounded-2xl bg-[#EFF7E9] border border-[#8CCB55] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#075B2A]">
                  {deliveryMethod === 'Home Delivery' ? (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Online Doorstep Delivery</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Direct Store Pickup (Warangal)</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-600">
                  {deliveryMethod === 'Home Delivery'
                    ? 'Fresh packaging & doorstep dispatch with tracking.'
                    : '11-18-356/3/A, Opp Sai Baba Temple, Kashibugga.'}
                </p>
              </div>
            </div>

            {/* 100% Organic & Security Trust Badge */}
            <div className="bg-white rounded-3xl border border-[#E1E9DC] p-5 shadow-xs space-y-3 text-xs text-[#667267]">
              <div className="flex items-center gap-2.5 text-[#075B2A] font-bold">
                <ShieldCheck className="w-5 h-5 text-[#4D963C]" />
                <span>100% Authentic Natural Harvests</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Every Graminum item is chemical-free, traditionally prepared, and packed fresh in Warangal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
