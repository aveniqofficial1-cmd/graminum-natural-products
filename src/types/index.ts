export type ProductCategory =
  | 'Personal Care'
  | 'Herbal Oils'
  | 'Natural Foods'
  | 'Herbal Wellness'
  | 'Pooja Essentials'
  | 'Fragrances';

export interface ProductPackOption {
  size: string;
  price: number;
  stock: number;
}

export interface NutritionalItem {
  label: string;
  value: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userLocation?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface Product {
  id: string;
  name: string;
  teluguName?: string;
  slug: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  packSize: string;
  packSizeOptions: ProductPackOption[];
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  shortDescription: string;
  fullDescription: string;
  ingredients: string[];
  nutritionalInfo: NutritionalItem[];
  benefits: string[];
  storageInfo: string;
  shelfLife: string;
  isOrganic: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  published: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedPackSize: string;
  unitPrice: number;
  quantity: number;
}

export interface Address {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  type?: 'Home' | 'Work' | 'Other';
}

export type OrderStatus =
  | 'Order Placed'
  | 'Accepted'
  | 'Preparing at Store'
  | 'Ready for Pickup'
  | 'Picked Up'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod =
  | 'UPI / QR Code'
  | 'Credit / Debit Card'
  | 'Net Banking'
  | 'Cash on Delivery'
  | 'Manual Transfer (Screenshot)';

export type PaymentStatus = 'Pending' | 'Verified' | 'Failed' | 'Refunded' | 'Cash on Delivery';

export type DeliveryMethod = 'Store Pickup' | 'Home Delivery';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  deliveryMethod: DeliveryMethod;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentScreenshot?: string;
  paymentUtr?: string;
  paymentNotes?: string;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  internalAdminNotes?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Ordering' | 'Payment' | 'Delivery' | 'Products' | 'Returns & Support';
}

export type UserRole = 'customer' | 'manager' | 'admin';

export interface User {
  id: string;
  firebaseUid?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  photoURL?: string;
  authProvider?: 'google' | 'password' | 'demo';
  addresses: Address[];
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'order' | 'offer' | 'system';
  link?: string;
}

export interface StorePaymentSettings {
  whatsappNumber: string;
  upiId: string;
  merchantName: string;
  customQrCodeUrl?: string;
  adminSecurityPassword: string;
  instructions?: string;
}
