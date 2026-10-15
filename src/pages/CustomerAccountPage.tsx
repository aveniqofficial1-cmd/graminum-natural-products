import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Package,
  MapPin,
  Bell,
  Star,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/common/Breadcrumb';
import { Address, OrderStatus } from '../types';

type AccountTab = 'dashboard' | 'orders' | 'profile' | 'addresses' | 'notifications' | 'reviews';

interface CustomerAccountPageProps {
  initialAuthMode?: 'login' | 'signup';
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({ initialAuthMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');

  const {
    currentUser,
    isAuthenticated,
    loginCustomer,
    signupCustomer,
    loginWithGoogle,
    logoutCustomer,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    notifications,
    markNotificationRead,
    userReviews,
    sendForgotPasswordEmail,
  } = useAuth();

  const { orders } = useOrders();
  const { wishlistCount } = useWishlist();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AccountTab>('dashboard');

  // Auth Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(
    initialAuthMode || (urlMode === 'signup' ? 'signup' : 'login')
  );

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (urlMode === 'signup') {
      setAuthMode('signup');
    } else if (urlMode === 'login') {
      setAuthMode('login');
    }
  }, [urlMode]);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRemember, setLoginRemember] = useState(true);

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupAgree, setSignupAgree] = useState(true);

  // Orders Tab Filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Profile Edit State
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrEmail, setAddrEmail] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('Hyderabad');
  const [addrState, setAddrState] = useState('Telangana');
  const [addrPincode, setAddrPincode] = useState('500033');
  const [addrType, setAddrType] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Keep profile inputs in sync when user logs in
  useEffect(() => {
    if (currentUser) {
      setNameInput(currentUser.name);
      setEmailInput(currentUser.email);
      setPhoneInput(currentUser.phone);
    }
  }, [currentUser]);

  // Filter orders for current user — strict email match only
  const userOrders = orders.filter(
    (o) =>
      currentUser &&
      o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const filteredOrders = userOrders.filter((o) => {
    if (orderStatusFilter === 'All') return true;
    if (orderStatusFilter === 'Pending') return o.orderStatus === 'Order Placed';
    if (orderStatusFilter === 'Processing')
      return o.orderStatus === 'Accepted' || o.orderStatus === 'Preparing';
    if (orderStatusFilter === 'Delivered') return o.orderStatus === 'Delivered';
    if (orderStatusFilter === 'Cancelled') return o.orderStatus === 'Cancelled';
    return true;
  });

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    const success = loginCustomer(loginEmail, loginPassword);
    if (success) {
      setLoginPassword('');
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (!signupEmail || !signupEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'error');
      return;
    }
    if (!signupAgree) {
      showToast('Please accept the terms and conditions to register.', 'error');
      return;
    }

    const success = signupCustomer(signupName, signupEmail, signupPhone, signupPassword);
    if (success) {
      setSignupName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameInput.trim(),
      email: emailInput.trim(),
      phone: phoneInput.trim(),
    });
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrFullName(currentUser?.name || '');
    setAddrPhone(currentUser?.phone || '');
    setAddrEmail(currentUser?.email || '');
    setAddrLine('');
    setAddrCity('Hyderabad');
    setAddrState('Telangana');
    setAddrPincode('500033');
    setAddrType('Home');
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrEmail(addr.email);
    setAddrLine(addr.addressLine);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrType(addr.type || 'Home');
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrFullName || !addrPhone || !addrLine || !addrCity || !addrPincode) {
      showToast('Please complete all required address fields', 'error');
      return;
    }

    if (editingAddressId) {
      updateAddress({
        id: editingAddressId,
        fullName: addrFullName.trim(),
        email: addrEmail.trim(),
        phone: addrPhone.trim(),
        addressLine: addrLine.trim(),
        city: addrCity.trim(),
        state: addrState,
        pincode: addrPincode.trim(),
        type: addrType,
      });
    } else {
      addAddress({
        fullName: addrFullName.trim(),
        email: addrEmail.trim(),
        phone: addrPhone.trim(),
        addressLine: addrLine.trim(),
        city: addrCity.trim(),
        state: addrState,
        pincode: addrPincode.trim(),
        type: addrType,
      });
    }
    setIsAddressModalOpen(false);
  };

  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      showToast('Please enter your registered email.', 'error');
      return;
    }
    setIsForgotSubmitting(true);
    try {
      const success = await sendForgotPasswordEmail(forgotEmail);
      if (success) {
        setIsForgotPasswordOpen(false);
        setForgotEmail('');
      }
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  // ================= UNAUTHENTICATED: LOGIN & SIGNUP PORTAL =================
  if (!isAuthenticated) {
    return (
      <div className="w-full bg-[#FBF8EF] min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
          {/* Top Logo & Welcome */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src="/assets/graminum-logo.png"
                alt="Graminum Logo"
                className="h-12 w-auto mx-auto"
              />
            </Link>
            <h1 className="text-2xl font-black text-[#075B2A] font-serif-title">
              {authMode === 'login' ? 'Welcome to Graminum' : 'Create Your Account'}
            </h1>
            <p className="text-xs text-[#667267]">
              {authMode === 'login'
                ? 'Sign in to access your natural products orders & saved addresses.'
                : 'Join our family for 100% pure, authentic natural products.'}
            </p>
          </div>

          {/* Google Sign In via Firebase */}
          <button
            type="button"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-[#E1E9DC] hover:border-[#075B2A] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-xs active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {/* Official Google SVG Icon */}
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
            <span>{isGoogleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E1E9DC] w-full"></div>
            <span className="bg-white px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
              Or with email
            </span>
          </div>

          {/* Auth Tab Switcher (Sign In vs Sign Up) */}
          <div className="flex rounded-2xl bg-[#FBF8EF] p-1 border border-[#E1E9DC]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setSearchParams({ mode: 'login' });
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#075B2A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSearchParams({ mode: 'signup' });
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-gray-600 hover:text-[#075B2A]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* ================= TAB 1: LOGIN FORM ================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#18251B]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-[#075B2A] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075B2A] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={loginRemember}
                    onChange={(e) => setLoginRemember(e.target.checked)}
                    className="w-4 h-4 rounded text-[#075B2A] focus:ring-[#075B2A] border-gray-300"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-gray-500 pt-2">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSearchParams({ mode: 'signup' });
                  }}
                  className="font-bold text-[#075B2A] hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* ================= TAB 2: SIGNUP FORM ================= */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="ramesh@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Phone Number (for WhatsApp pickup alerts & receipts)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98490 12345"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Create Password (min. 6 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075B2A] cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className={`w-full bg-[#FBF8EF] text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none ${
                      signupConfirmPassword && signupPassword !== signupConfirmPassword
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-[#E1E9DC] focus:border-[#075B2A]'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={signupAgree}
                    onChange={(e) => setSignupAgree(e.target.checked)}
                    className="w-4 h-4 rounded text-[#075B2A] focus:ring-[#075B2A] mt-0.5 border-gray-300"
                  />
                  <span>
                    I agree to Graminum's{' '}
                    <span className="text-[#075B2A] font-bold">Terms of Natural Purity</span> & Privacy Policy
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#075B2A] hover:bg-[#06451F] text-white text-xs sm:text-sm font-bold py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Complete Registration & Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-gray-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setSearchParams({ mode: 'login' });
                  }}
                  className="font-bold text-[#075B2A] hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FORGOT PASSWORD MODAL */}
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsForgotPasswordOpen(false)}
            ></div>

            <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full z-10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E1E9DC]">
                <h3 className="text-sm font-bold text-[#075B2A] font-serif-title">
                  Reset Account Password
                </h3>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Enter your registered email address and we'll send you instructions to set a new password.
              </p>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC]"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotSubmitting}
                    className="flex-1 bg-[#075B2A] hover:bg-[#06451F] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isForgotSubmitting ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= AUTHENTICATED: FULL CUSTOMER PORTAL =================
  return (
    <div className="w-full bg-[#FBF8EF] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Header */}
        <Breadcrumb items={[{ label: 'My Account' }]} />

        {/* User Welcome Banner */}
        <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#8CCB55] shadow-md"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#075B2A] text-white flex items-center justify-center text-xl sm:text-2xl font-black font-serif-title shadow-md">
                {currentUser?.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'G'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#075B2A] font-serif-title">
                  Namaskaram, {currentUser?.name}
                </h1>
                <span className="bg-[#EFF7E9] text-[#075B2A] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#8CCB55]">
                  {currentUser?.role === 'admin'
                    ? '👑 Admin'
                    : currentUser?.role === 'manager'
                    ? '🛡️ Store Manager'
                    : 'Verified Member'}
                </span>
              </div>
              <p className="text-xs text-[#667267] mt-0.5">
                {currentUser?.email} • {currentUser?.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 bg-[#EFF7E9] hover:bg-[#075B2A] text-[#075B2A] hover:text-white border border-[#8CCB55] text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-[#4D963C]" />
                <span>{currentUser.role === 'admin' ? 'Admin Console' : 'Manager Console'}</span>
              </Link>
            )}

            <button
              onClick={logoutCustomer}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2-Column Dashboard Grid: Navigation Tabs & Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT NAVIGATION SIDEBAR (3 Cols) ================= */}
          <aside className="lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#E1E9DC] shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Overview Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {userOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4" />
                <span>Address Book</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {currentUser?.addresses?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {notifications.some((n) => !n.read) && (
                <span className="bg-[#D92D20] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>My Reviews</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {userReviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#075B2A] text-white shadow-xs'
                  : 'text-[#18251B] hover:bg-[#EFF7E9] hover:text-[#075B2A]'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </aside>

          {/* ================= RIGHT MAIN CONTENT (9 Cols) ================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* 3 Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-2">
                    <span className="text-xs text-gray-400 font-bold uppercase">
                      Total Orders
                    </span>
                    <p className="text-2xl font-black text-[#075B2A]">{userOrders.length}</p>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#075B2A] hover:underline block pt-1 cursor-pointer"
                    >
                      View All Orders →
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-2">
                    <span className="text-xs text-gray-400 font-bold uppercase">
                      Saved Addresses
                    </span>
                    <p className="text-2xl font-black text-[#075B2A]">
                      {currentUser?.addresses?.length || 0}
                    </p>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="text-xs font-bold text-[#075B2A] hover:underline block pt-1 cursor-pointer"
                    >
                      Manage Address Book →
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-[#E1E9DC] shadow-xs space-y-2">
                    <span className="text-xs text-gray-400 font-bold uppercase">
                      Wishlist Items
                    </span>
                    <p className="text-2xl font-black text-[#075B2A]">{wishlistCount}</p>
                    <Link
                      to="/shop?filter=wishlist"
                      className="text-xs font-bold text-[#075B2A] hover:underline block pt-1"
                    >
                      Explore Wishlist →
                    </Link>
                  </div>
                </div>

                {/* Recent Order Preview */}
                <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
                    <h3 className="text-sm font-bold text-[#075B2A] uppercase tracking-wider">
                      Most Recent Order
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#075B2A] hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  {userOrders[0] ? (
                    <div className="space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#FBF8EF] rounded-2xl border border-[#E1E9DC]">
                        <div>
                          <p className="font-extrabold text-[#075B2A] text-sm">
                            #{userOrders[0].orderNumber}
                          </p>
                          <p className="text-gray-500">
                            Placed on {new Date(userOrders[0].createdAt).toLocaleDateString('en-IN')} •{' '}
                            {userOrders[0].items.length} item(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#075B2A] text-base">
                            ₹{userOrders[0].grandTotal}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                            {userOrders[0].orderStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          to={`/track-order/${userOrders[0].orderNumber}`}
                          className="inline-flex items-center gap-1.5 bg-[#075B2A] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Track Live Status</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <p className="text-xs">No orders placed yet.</p>
                      <Link
                        to="/shop"
                        className="inline-block mt-2 text-xs font-bold text-[#075B2A] hover:underline"
                      >
                        Start shopping pure natural products →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E9DC]">
                  <div>
                    <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                      Your Order History
                    </h2>
                    <p className="text-xs text-[#667267]">
                      Track store pickup stages, receipts, and order breakdowns.
                    </p>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-[#075B2A] text-white shadow-xs'
                            : 'bg-[#FBF8EF] text-gray-600 hover:bg-[#EFF7E9]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-2xl border border-[#E1E9DC] bg-[#FBF8EF]/40 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E1E9DC]">
                          <div>
                            <span className="font-black text-[#075B2A] text-sm">
                              #{order.orderNumber}
                            </span>
                            <p className="text-[11px] text-gray-500">
                              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-[#075B2A]">
                              ₹{order.grandTotal}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-gray-100 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={it.product.image}
                                  alt={it.product.name}
                                  className="w-10 h-10 object-cover rounded-xl border bg-[#EFF7E9]"
                                />
                                <div>
                                  <p className="font-bold text-[#18251B]">{it.product.name}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Pack: {it.selectedPackSize} × {it.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-[#075B2A]">
                                ₹{it.unitPrice * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                          <span className="text-[11px] text-gray-500">
                            Payment: <strong>{order.paymentMethod}</strong> (
                            {order.paymentMethod === 'Cash on Delivery'
                              ? order.paymentStatus === 'Verified'
                                ? 'Cash Paid'
                                : 'Pay on Delivery'
                              : order.paymentStatus}
                            )
                          </span>
                          <Link
                            to={`/track-order/${order.orderNumber}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#075B2A] hover:underline"
                          >
                            <span>Live Timeline & Tracking →</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-[#18251B]">No matching orders found</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. ADDRESS BOOK TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E1E9DC]">
                  <div>
                    <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-[#667267]">
                      Manage multiple home and office destinations.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentUser?.addresses?.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition-all relative space-y-3 ${
                        addr.isDefault
                          ? 'bg-[#EFF7E9]/40 border-[#8CCB55] shadow-xs'
                          : 'bg-[#FBF8EF]/60 border-[#E1E9DC]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#075B2A] uppercase">
                          {addr.type || 'Home'} Destination
                        </span>
                        {addr.isDefault && (
                          <span className="bg-[#075B2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1 text-[#18251B]">
                        <p className="font-bold">{addr.fullName}</p>
                        <p className="text-gray-600">{addr.addressLine}</p>
                        <p className="text-gray-600">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className="text-gray-600 pt-1">📞 {addr.phone}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setDefaultAddress(addr.id)}
                            className="text-[#075B2A] font-bold hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                          <button
                            onClick={() => handleOpenEditAddress(addr)}
                            className="text-gray-600 hover:text-[#075B2A] cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteAddress(addr.id)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-4">
                <div className="pb-3 border-b border-[#E1E9DC]">
                  <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                    Notifications & Dispatch Alerts
                  </h2>
                  <p className="text-xs text-[#667267]">
                    Stay informed on batch packaging, delivery progress, and seasonal offers.
                  </p>
                </div>

                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                        n.read ? 'bg-[#FBF8EF]/40 border-[#E1E9DC]' : 'bg-[#EFF7E9] border-[#8CCB55]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#075B2A]"></span>
                          )}
                          <h4 className="text-xs font-bold text-[#18251B]">{n.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{n.message}</p>
                        <span className="text-[10px] text-gray-400 block">{n.date}</span>
                      </div>

                      {n.link && (
                        <Link
                          to={n.link}
                          className="text-xs font-bold text-[#075B2A] hover:underline shrink-0"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 shadow-sm space-y-4">
                <div className="pb-3 border-b border-[#E1E9DC]">
                  <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                    Your Verified Reviews
                  </h2>
                  <p className="text-xs text-[#667267]">
                    Feedback you shared with the Graminum natural community.
                  </p>
                </div>

                {userReviews.length > 0 ? (
                  <div className="space-y-3">
                    {userReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl border border-[#E1E9DC] bg-[#FBF8EF]/40 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400">{rev.date}</span>
                        </div>
                        <p className="text-gray-700 italic leading-relaxed">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-xs">You haven't reviewed any items yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 6. PROFILE EDIT TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-[#E1E9DC] p-6 sm:p-8 shadow-sm space-y-6">
                <div className="pb-4 border-b border-[#E1E9DC]">
                  <h2 className="text-base font-bold text-[#075B2A] font-serif-title">
                    Personal Profile Details
                  </h2>
                  <p className="text-xs text-[#667267]">
                    Update your account details and contact coordinates.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-[#18251B] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18251B] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#18251B] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2.5 rounded-xl border border-[#E1E9DC] focus:outline-none focus:border-[#075B2A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#075B2A] hover:bg-[#06451F] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================= ADD / EDIT ADDRESS MODAL ================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsAddressModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E9DC]">
              <h3 className="text-base font-bold text-[#075B2A] font-serif-title">
                {editingAddressId ? 'Edit Address' : 'Add New Delivery Address'}
              </h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2 rounded-xl border border-[#E1E9DC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#18251B] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2 rounded-xl border border-[#E1E9DC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18251B] mb-1">Email</label>
                  <input
                    type="email"
                    value={addrEmail}
                    onChange={(e) => setAddrEmail(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2 rounded-xl border border-[#E1E9DC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">
                  Street Address & Flat / House No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Sri Sai Residency, Jubilee Hills Road 36"
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className="w-full bg-[#FBF8EF] text-xs px-3.5 py-2 rounded-xl border border-[#E1E9DC]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#18251B] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs px-3 py-2 rounded-xl border border-[#E1E9DC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18251B] mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs px-3 py-2 rounded-xl border border-[#E1E9DC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#18251B] mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    className="w-full bg-[#FBF8EF] text-xs px-3 py-2 rounded-xl border border-[#E1E9DC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#18251B] mb-1">Address Label</label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddrType(t)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        addrType === t
                          ? 'bg-[#075B2A] text-white border-[#075B2A]'
                          : 'bg-[#FBF8EF] text-gray-700 border-[#E1E9DC]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E1E9DC]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#075B2A] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
