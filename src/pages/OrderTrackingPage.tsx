import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Store,
  MapPin,
  ShoppingBag,
  MessageCircle,
  Phone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  QrCode,
  ExternalLink,
  Lock,
  ArrowRight,
  User as UserIcon,
  Truck,
  Home,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useAuth } from '../context/AuthContext';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Order, OrderStatus } from '../types';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderById, orders } = useOrders();
  const { settings, generateWhatsAppOrderUrl } = useStoreSettings();
  const { currentUser, isAuthenticated, loginWithGoogle } = useAuth();

  const [searchQuery, setSearchQuery] = useState(orderId || '');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // A customer only ever sees orders placed with their own email.
  const userOrders = orders.filter(
    (o) => !!currentUser && o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const requestedOrder = orderId ? getOrderById(orderId) : undefined;
  const initialOrder =
    requestedOrder &&
    currentUser &&
    requestedOrder.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
      ? requestedOrder
      : userOrders[0];

  const [currentOrder, setCurrentOrder] = useState<Order | undefined>(initialOrder);

  useEffect(() => {
    if (orderId) {
      setSearchQuery(orderId);
      const found = getOrderById(orderId);
      if (found) setCurrentOrder(found);
    } else if (userOrders.length > 0 && !currentOrder) {
      setCurrentOrder(userOrders[0]);
    }
  }, [orderId, orders, userOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const clean = searchQuery.trim().replace('#', '');
      navigate(`/track-order/${clean}`);
      const found = getOrderById(clean);
      setCurrentOrder(found);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isHomeDelivery = currentOrder?.deliveryMethod === 'Home Delivery';

  const statusOrder: OrderStatus[] = isHomeDelivery
    ? ['Order Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered']
    : ['Order Placed', 'Accepted', 'Preparing at Store', 'Ready for Pickup', 'Picked Up'];

  const getStageIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Order Placed':
        return <Package className="w-5 h-5" />;
      case 'Accepted':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'Preparing at Store':
      case 'Preparing':
        return <Clock className="w-5 h-5" />;
      case 'Out for Delivery':
        return <Truck className="w-5 h-5" />;
      case 'Ready for Pickup':
        return <Store className="w-5 h-5" />;
      case 'Picked Up':
      case 'Delivered':
        return <ShoppingBag className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // ================= UNAUTHENTICATED STATE: LOGIN / SIGNUP REQUIRED =================
  if (!isAuthenticated) {
    return (
      <div className="w-full bg-[#FBF8EF] min-h-[80vh] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-[#EFF7E9] text-[#075B2A] rounded-3xl flex items-center justify-center mx-auto border border-[#8CCB55] shadow-xs">
            <Lock className="w-8 h-8 text-[#075B2A]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-[#4D963C] uppercase tracking-wider bg-[#EFF7E9] px-3 py-1 rounded-full border border-[#8CCB55]">
              Account Verification Required
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#075B2A] font-serif-title">
              Sign In to Track Your Orders
            </h1>
            <p className="text-xs sm:text-sm text-[#667267] leading-relaxed">
              To protect customer order information, delivery status, and payment receipts, please sign in or create a Graminum customer account.
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
              to="/login"
              className="w-full bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup"
              className="w-full bg-[#EFF7E9] hover:bg-[#8CCB55]/30 text-[#075B2A] border border-[#8CCB55] text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveStatus = currentOrder ? currentOrder.orderStatus : 'Order Placed';

  // ================= AUTHENTICATED STATE: FULL ORDER TRACKER =================
  return (
    <div className="w-full bg-[#FBF8EF] min-h-screen py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Breadcrumb Header */}
        <Breadcrumb items={[{ label: 'Track Order' }]} />

        {/* Search Order Form Banner */}
        <div className="bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-8 shadow-sm space-y-4">
          <div className="text-center max-w-lg mx-auto space-y-1">
            <span className="text-xs font-extrabold text-[#4D963C] uppercase tracking-wider">
              Live Order Fulfillment Tracker
            </span>
            <h1 className="text-xl sm:text-3xl font-black text-[#075B2A] font-serif-title">
              Track Your Order
            </h1>
            <p className="text-xs sm:text-sm text-[#667267]">
              Monitor packaging, doorstep dispatch, and live payment status.
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Order # (e.g. GRM-89241)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-9 pr-4 py-3 rounded-2xl border border-[#E1E9DC] uppercase font-bold focus:outline-none focus:border-[#075B2A]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              Track Order
            </button>
          </form>

          {/* Quick Select for Logged-In User's Orders */}
          {userOrders.length > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs pt-1">
              <span className="text-gray-400 font-medium">Your recent orders:</span>
              {userOrders.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSearchQuery(o.orderNumber);
                    navigate(`/track-order/${o.orderNumber}`);
                    setCurrentOrder(o);
                  }}
                  className={`font-bold px-3 py-1 rounded-xl border transition-colors cursor-pointer text-xs ${
                    currentOrder?.orderNumber === o.orderNumber
                      ? 'bg-[#075B2A] text-white border-[#075B2A]'
                      : 'bg-[#EFF7E9] text-[#075B2A] hover:bg-[#8CCB55] hover:text-[#06451F] border-[#8CCB55]'
                  }`}
                >
                  #{o.orderNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Details & Live Timeline Render */}
        {currentOrder ? (
          <div className="space-y-6">
            {/* Header Summary Card */}
            <div className="bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E1E9DC]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold uppercase">Order ID</span>
                    <h2 className="text-lg sm:text-2xl font-black text-[#075B2A] font-serif-title">
                      #{currentOrder.orderNumber}
                    </h2>
                  </div>
                  <p className="text-xs text-[#667267] mt-0.5">
                    Placed on{' '}
                    {new Date(currentOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Bill</p>
                    <p className="text-base sm:text-lg font-black text-[#075B2A]">
                      ₹{currentOrder.grandTotal}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      effectiveStatus === 'Delivered' || effectiveStatus === 'Picked Up'
                        ? 'bg-emerald-100 text-emerald-800'
                        : effectiveStatus === 'Out for Delivery' || effectiveStatus === 'Ready for Pickup'
                        ? 'bg-[#8CCB55] text-[#06451F] font-black'
                        : currentOrder.orderStatus === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : effectiveStatus === 'Accepted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-900 animate-pulse'
                    }`}
                  >
                    {effectiveStatus}
                  </span>
                </div>
              </div>

              {/* Payment Verification Status Ribbon */}
              <div className="mt-4 p-3.5 rounded-2xl bg-[#EFF7E9] border border-[#8CCB55] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {currentOrder.paymentMethod === 'Cash on Delivery' ? (
                    <Banknote className="w-5 h-5 text-[#075B2A] shrink-0" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-[#075B2A] shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-[#18251B]">
                      Payment: {currentOrder.paymentMethod}{' '}
                      <span
                        className={
                          currentOrder.paymentMethod === 'Cash on Delivery'
                            ? currentOrder.paymentStatus === 'Verified'
                              ? 'text-emerald-700 font-black'
                              : 'text-[#075B2A] font-bold'
                            : currentOrder.paymentStatus === 'Verified'
                            ? 'text-emerald-700 font-black'
                            : 'text-amber-700 font-bold'
                        }
                      >
                        {currentOrder.paymentMethod === 'Cash on Delivery'
                          ? currentOrder.paymentStatus === 'Verified'
                            ? '• ✓ Cash Collected'
                            : `• 💵 Pay ₹${currentOrder.grandTotal} upon doorstep delivery`
                          : currentOrder.paymentStatus === 'Verified'
                          ? '• ✓ Verified & Approved by Store Admin'
                          : '• ⏳ Awaiting Store Verification'}
                      </span>
                    </span>
                    {currentOrder.paymentUtr && (
                      <p className="text-[11px] text-gray-500 font-mono">
                        UTR Ref: {currentOrder.paymentUtr}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={generateWhatsAppOrderUrl(currentOrder)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Resend Details on WhatsApp</span>
                </a>
              </div>

              {/* 5-STAGE STATUS TIMELINE */}
              <div className="pt-6 sm:pt-8 pb-4">
                <h3 className="text-xs font-bold text-[#18251B] uppercase tracking-wider mb-6 flex items-center gap-2">
                  {isHomeDelivery ? <Truck className="w-4 h-4 text-[#075B2A]" /> : <Store className="w-4 h-4 text-[#075B2A]" />}
                  <span>
                    {isHomeDelivery ? 'Online Home Delivery Progress' : 'Store Pickup Fulfillment Progress'}
                  </span>
                </h3>

                <div className="relative">
                  {/* Desktop Horizontal Timeline */}
                  <div className="hidden sm:grid grid-cols-5 gap-2 relative">
                    <div className="absolute top-5 left-8 right-8 h-1 bg-[#E1E9DC] z-0"></div>

                    {statusOrder.map((stageName, idx) => {
                      const timelineEvent = currentOrder.timeline.find(
                        (t) => t.status === stageName
                      );
                      const isCompleted = timelineEvent?.completed || false;
                      const isCurrentActive =
                        effectiveStatus === stageName &&
                        effectiveStatus !== 'Delivered' &&
                        effectiveStatus !== 'Picked Up' &&
                        currentOrder.orderStatus !== 'Cancelled';

                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#075B2A] text-white shadow-md'
                                : isCurrentActive
                                ? 'bg-[#8CCB55] text-[#06451F] ring-4 ring-[#8CCB55]/30 shadow-md animate-bounce'
                                : 'bg-white border-2 border-[#E1E9DC] text-gray-400'
                            }`}
                          >
                            {getStageIcon(stageName)}
                          </div>
                          <p
                            className={`text-xs font-bold mt-2.5 ${
                              isCompleted || isCurrentActive ? 'text-[#075B2A]' : 'text-gray-400'
                            }`}
                          >
                            {stageName}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 px-1">
                            {timelineEvent?.timestamp || 'Pending'}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Vertical Timeline */}
                  <div className="sm:hidden space-y-6 relative pl-6 border-l-2 border-[#E1E9DC] ml-3">
                    {statusOrder.map((stageName, idx) => {
                      const timelineEvent = currentOrder.timeline.find(
                        (t) => t.status === stageName
                      );
                      const isCompleted = timelineEvent?.completed || false;
                      const isCurrentActive =
                        effectiveStatus === stageName &&
                        effectiveStatus !== 'Delivered' &&
                        effectiveStatus !== 'Picked Up';

                      return (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-[#075B2A] text-white'
                                : isCurrentActive
                                ? 'bg-[#8CCB55] text-[#06451F] ring-4 ring-[#8CCB55]/30'
                                : 'bg-white border-2 border-[#E1E9DC] text-gray-400'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <p
                            className={`text-xs font-bold ${
                              isCompleted || isCurrentActive ? 'text-[#075B2A]' : 'text-gray-400'
                            }`}
                          >
                            {stageName}
                          </p>
                          <p className="text-[11px] text-[#667267] mt-0.5">
                            {timelineEvent?.description || 'Awaiting stage trigger'}
                          </p>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {timelineEvent?.timestamp || 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 2 Columns: Purchased Items & Delivery / Store Location */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Items List (7 Cols) */}
              <div className="md:col-span-7 bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider pb-3 border-b border-[#E1E9DC]">
                  Items in this Order
                </h3>

                <div className="divide-y divide-[#E1E9DC]">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-xl border shrink-0 bg-[#EFF7E9]"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/product/${item.product.slug}`}
                            className="font-bold text-[#18251B] hover:text-[#075B2A] truncate block"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-[11px] text-[#667267]">
                            {item.selectedPackSize} × {item.quantity} units
                          </p>
                        </div>
                      </div>
                      <span className="font-extrabold text-[#075B2A] shrink-0">
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address or Store Pickup Location (5 Cols) */}
              <div className="md:col-span-5 bg-white rounded-3xl border border-[#E1E9DC] p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E1E9DC]">
                    {isHomeDelivery ? (
                      <>
                        <Home className="w-4 h-4 text-[#075B2A]" />
                        <h3 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider">
                          Doorstep Delivery Address
                        </h3>
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4 text-[#075B2A]" />
                        <h3 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider">
                          Store Pickup Location
                        </h3>
                      </>
                    )}
                  </div>

                  {isHomeDelivery ? (
                    <div className="p-3.5 bg-[#EFF7E9] rounded-2xl border border-[#8CCB55] space-y-1.5 text-xs">
                      <p className="font-black text-[#075B2A]">{currentOrder.shippingAddress.fullName}</p>
                      <p className="text-gray-700 leading-relaxed">
                        {currentOrder.shippingAddress.addressLine}
                      </p>
                      <p className="text-gray-700">
                        {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} - {currentOrder.shippingAddress.pincode}
                      </p>
                      <p className="text-[#075B2A] font-bold pt-1">
                        📞 Contact: {currentOrder.shippingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#EFF7E9] rounded-2xl border border-[#8CCB55] space-y-2">
                      <p className="font-black text-[#075B2A] text-xs">
                        Graminum Herbal & Natural Store
                      </p>
                      <div className="text-xs text-[#18251B] space-y-1">
                        <p className="font-semibold">11-18-356/3/A</p>
                        <p className="text-gray-600">Opposite Sai Baba Temple,</p>
                        <p className="text-gray-600">Beside Assisi School, O City,</p>
                        <p className="text-gray-600">Kashibugga, Warangal - 506002</p>
                        <p className="text-[#075B2A] font-bold pt-1">📞 Counter: 9396723139</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#FBF8EF] p-3 rounded-xl border border-[#E1E9DC] text-xs text-[#667267] space-y-1">
                    <p className="font-bold text-[#18251B]">
                      {isHomeDelivery ? '🚚 Delivery Info:' : '📌 Pickup Instructions:'}
                    </p>
                    <p className="text-[11px]">
                      {isHomeDelivery
                        ? 'Package will be delivered to your doorstep. Keep cash ready if opted for Cash on Delivery.'
                        : `Please present your Order ID (#${currentOrder.orderNumber}) at the store counter upon arrival.`}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E1E9DC] space-y-2">
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#EFF7E9] hover:bg-[#8CCB55] text-[#075B2A] hover:text-[#06451F] text-xs font-bold py-2.5 rounded-xl border border-[#8CCB55] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Need Help? Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E1E9DC] p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-[#18251B] font-serif-title">
              No Matching Order Found
            </h3>
            <p className="text-xs sm:text-sm text-[#667267] max-w-sm mx-auto">
              Please check your order number from your confirmation message, or explore our fresh harvests.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-[#075B2A] text-white text-xs font-bold px-6 py-2.5 rounded-xl"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
