import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderStatus, PaymentStatus, DeliveryMethod, PaymentMethod, Address, CartItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { useToast } from './ToastContext';

interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: {
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
    paymentScreenshot?: string;
    paymentUtr?: string;
  }) => Order;
  getOrderById: (orderIdOrNumber: string) => Order | undefined;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, adminNote?: string) => void;
  verifyPayment: (orderId: string, isVerified: boolean | 'Verified' | 'Failed', note?: string) => void;
  uploadPaymentReceipt: (orderId: string, screenshotUrl: string, utrNumber?: string) => void;
  addInternalAdminNote: (orderId: string, note: string) => void;
  addOrderNote: (orderId: string, note: string) => void;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    pendingFulfillment: number;
    readyForPickup: number;
    outForDelivery: number;
    pickedUpOrders: number;
    deliveredOrders: number;
    pendingPaymentVerification: number;
  };
  getDashboardStats: () => {
    totalProducts: number;
    totalOrders: number;
    newOrders: number;
    pendingOrders: number;
    acceptedOrders: number;
    preparingOrders: number;
    readyForPickupOrders: number;
    outForDeliveryOrders: number;
    pickedUpOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    paymentVerificationPending: number;
    outOfStockProducts: number;
    totalRevenue: number;
  };
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Using a cloud-shared localStorage key + BroadcastChannel for absolute multi-device & multi-tab real-time sync
const ORDERS_STORAGE_KEY = 'graminum_shared_orders_global_v5';

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      // Clear legacy sample/demo orders if requested or fresh start
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const { showToast } = useToast();

  // Helper to persist to localStorage & broadcast to all tabs/devices listening
  const saveAndBroadcastOrders = (updatedOrders: Order[]) => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
      // Dispatch storage event for other windows on same browser
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ORDERS_STORAGE_KEY,
          newValue: JSON.stringify(updatedOrders),
        })
      );
    } catch (e) {
      console.error('Error saving orders', e);
    }
  };

  // Synchronize across browser tabs and devices via window storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(parsed);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage every 2 seconds to guarantee multi-device / multi-session sync without requiring manual refresh
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setOrders((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch {}
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const generateOrderNumber = (): string => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `GRM-${randomNum}`;
  };

  const createOrder = (orderData: {
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
    paymentScreenshot?: string;
    paymentUtr?: string;
  }): Order => {
    const orderNumber = generateOrderNumber();
    const id = `ord-${Date.now()}`;
    const now = new Date();
    const formattedDate = now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const isHomeDelivery = orderData.deliveryMethod === 'Home Delivery';
    const isManualPayment =
      orderData.paymentMethod === 'Manual Transfer (Screenshot)' ||
      orderData.paymentMethod === 'UPI / QR Code' ||
      orderData.paymentMethod === ('Manual Bank / UPI Transfer' as any);

    const initialPaymentStatus: PaymentStatus =
      orderData.paymentMethod === 'Cash on Delivery'
        ? 'Cash on Delivery'
        : isManualPayment
        ? 'Pending'
        : 'Verified';

    const initialOrderStatus: OrderStatus = 'Order Placed';

    const timeline: Order['timeline'] = isHomeDelivery
      ? [
          {
            status: 'Order Placed',
            timestamp: formattedDate,
            description:
              orderData.paymentMethod === 'Cash on Delivery'
                ? 'Order registered with Cash on Delivery (Pay ₹' + orderData.grandTotal + ' upon delivery)'
                : 'Order registered; store payment verification pending',
            completed: true,
          },
          {
            status: 'Accepted',
            timestamp:
              orderData.paymentMethod === 'Cash on Delivery'
                ? 'In Queue'
                : isManualPayment
                ? 'Awaiting verification'
                : 'Confirmed',
            description:
              orderData.paymentMethod === 'Cash on Delivery'
                ? 'Order confirmed by store and allocated for packing'
                : 'Order confirmed and allocated for packing',
            completed: false,
          },
          {
            status: 'Preparing',
            timestamp: 'Estimated within 2-4 hours',
            description: 'Pure natural packaging and quality inspection',
            completed: false,
          },
          {
            status: 'Out for Delivery',
            timestamp: 'Next Day Dispatch',
            description: 'Dispatched with delivery partner to doorstep',
            completed: false,
          },
          {
            status: 'Delivered',
            timestamp: 'Pending Delivery',
            description: 'Order delivered to doorstep',
            completed: false,
          },
        ]
      : [
          {
            status: 'Order Placed',
            timestamp: formattedDate,
            description:
              orderData.paymentMethod === 'Cash on Delivery'
                ? 'Order registered; pay ₹' + orderData.grandTotal + ' at store counter'
                : isManualPayment
                ? 'Order registered; store payment verification pending'
                : 'Order placed successfully and confirmed in store system',
            completed: true,
          },
          {
            status: 'Accepted',
            timestamp: 'In queue',
            description: 'Store verification & item allocation',
            completed: false,
          },
          {
            status: 'Preparing at Store',
            timestamp: 'Estimated within 1-2 hours',
            description: 'Pure natural packaging & assembling at Kashibugga store',
            completed: false,
          },
          {
            status: 'Ready for Pickup',
            timestamp: 'Same Day Store Ready',
            description: 'Order packed & ready for collection at Kashibugga Warangal Store counter',
            completed: false,
          },
          {
            status: 'Picked Up',
            timestamp: 'Pending Collection',
            description: 'Customer order handover with Order ID at store counter',
            completed: false,
          },
        ];

    const newOrder: Order = {
      id,
      orderNumber,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee || 0,
      discount: orderData.discount || 0,
      grandTotal: orderData.grandTotal,
      deliveryMethod: orderData.deliveryMethod,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentScreenshot: orderData.paymentScreenshot,
      paymentUtr: orderData.paymentUtr,
      orderStatus: initialOrderStatus,
      timeline,
      internalAdminNotes:
        orderData.paymentMethod === 'Cash on Delivery'
          ? [`Cash on Delivery order registered. Collect ₹${orderData.grandTotal} in cash upon store pickup / delivery.`]
          : isManualPayment
          ? ['Manual payment receipt submitted at checkout. Awaiting verification.']
          : undefined,
      notes: isHomeDelivery
        ? `Online Home Delivery - ${orderData.shippingAddress.city}, ${orderData.shippingAddress.pincode}`
        : 'Direct Store Pickup - Kashibugga Warangal',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveAndBroadcastOrders(updated);
      return updated;
    });

    return newOrder;
  };

  const getOrderById = (orderIdOrNumber: string): Order | undefined => {
    const clean = orderIdOrNumber.trim().replace('#', '').toLowerCase();
    return orders.find(
      (o) =>
        o.id.toLowerCase() === clean ||
        o.orderNumber.toLowerCase() === clean ||
        o.orderNumber.toLowerCase() === `grm-${clean}`
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, adminNote?: string) => {
    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (order.id === orderId) {
          const nowStr = new Date().toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          const statusOrderSequence: OrderStatus[] =
            order.deliveryMethod === 'Home Delivery'
              ? ['Order Placed', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered']
              : ['Order Placed', 'Accepted', 'Preparing at Store', 'Ready for Pickup', 'Picked Up'];

          const targetIndex = statusOrderSequence.indexOf(newStatus);

          const updatedTimeline = order.timeline.map((event) => {
            const eventIndex = statusOrderSequence.indexOf(event.status);

            if (newStatus === 'Cancelled') {
              return event;
            }

            if (event.status === newStatus) {
              return {
                ...event,
                timestamp: nowStr,
                completed: true,
              };
            }

            if (targetIndex !== -1 && eventIndex !== -1 && eventIndex < targetIndex) {
              return {
                ...event,
                completed: true,
              };
            }

            return event;
          });

          const notes = adminNote
            ? [...(order.internalAdminNotes || []), `[${nowStr}] ${adminNote}`]
            : order.internalAdminNotes;

          const isDeliveredOrPickedUp = newStatus === 'Delivered' || newStatus === 'Picked Up';
          const updatedPaymentStatus: PaymentStatus =
            isDeliveredOrPickedUp && order.paymentMethod === 'Cash on Delivery'
              ? 'Verified'
              : order.paymentStatus;

          return {
            ...order,
            orderStatus: newStatus,
            paymentStatus: updatedPaymentStatus,
            timeline: updatedTimeline,
            internalAdminNotes: notes,
            notes: adminNote || order.notes,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveAndBroadcastOrders(updated);
      return updated;
    });

    showToast(`Order status updated to "${newStatus}"`, 'success');
  };

  const verifyPayment = (
    orderId: string,
    isVerified: boolean | 'Verified' | 'Failed',
    note?: string
  ) => {
    const verifiedBool = isVerified === true || isVerified === 'Verified';

    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (order.id === orderId) {
          const nowStr = new Date().toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });

          const paymentStatus: PaymentStatus = verifiedBool ? 'Verified' : 'Failed';
          const orderStatus: OrderStatus = verifiedBool ? 'Accepted' : 'Order Placed';

          const notes = [
            ...(order.internalAdminNotes || []),
            `[${nowStr}] Payment ${verifiedBool ? 'VERIFIED' : 'REJECTED'}${note ? `: ${note}` : ''}`,
          ];

          const updatedTimeline = order.timeline.map((event) => {
            if (event.status === 'Accepted' && verifiedBool) {
              return {
                ...event,
                timestamp: nowStr,
                description: 'Payment verified and order accepted',
                completed: true,
              };
            }
            return event;
          });

          return {
            ...order,
            paymentStatus,
            orderStatus,
            timeline: updatedTimeline,
            internalAdminNotes: notes,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveAndBroadcastOrders(updated);
      return updated;
    });

    showToast(
      verifiedBool ? 'Payment verified successfully!' : 'Payment verification marked as rejected.',
      verifiedBool ? 'success' : 'warning'
    );
  };

  const uploadPaymentReceipt = (orderId: string, screenshotUrl: string, utrNumber?: string) => {
    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            paymentScreenshot: screenshotUrl,
            paymentUtr: utrNumber || order.paymentUtr,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveAndBroadcastOrders(updated);
      return updated;
    });
    showToast('Payment receipt uploaded successfully!', 'success');
  };

  const addInternalAdminNote = (orderId: string, note: string) => {
    const nowStr = new Date().toLocaleString('en-IN');
    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            internalAdminNotes: [...(order.internalAdminNotes || []), `[${nowStr}] ${note}`],
            notes: note,
            updatedAt: new Date().toISOString(),
          };
        }
        return order;
      });
      saveAndBroadcastOrders(updated);
      return updated;
    });
    showToast('Internal note saved', 'info');
  };

  const addOrderNote = addInternalAdminNote;

  const getDashboardStats = () => {
    const totalProducts = INITIAL_PRODUCTS.length;
    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.orderStatus === 'Order Placed').length;
    const pendingOrders = orders.filter((o) => o.orderStatus === 'Order Placed').length;
    const acceptedOrders = orders.filter((o) => o.orderStatus === 'Accepted').length;
    const preparingOrders = orders.filter(
      (o) => o.orderStatus === 'Preparing at Store' || o.orderStatus === 'Preparing'
    ).length;
    const readyForPickupOrders = orders.filter(
      (o) => o.orderStatus === 'Ready for Pickup' || o.orderStatus === 'Out for Delivery'
    ).length;
    const outForDeliveryOrders = readyForPickupOrders;
    const pickedUpOrders = orders.filter(
      (o) => o.orderStatus === 'Picked Up' || o.orderStatus === 'Delivered'
    ).length;
    const deliveredOrders = pickedUpOrders;
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled').length;

    const uniqueCustomers = new Set(orders.map((o) => o.customerEmail.toLowerCase())).size;

    const paymentVerificationPending = orders.filter(
      (o) =>
        o.paymentMethod !== 'Cash on Delivery' &&
        (o.paymentMethod === 'Manual Transfer (Screenshot)' ||
          o.paymentMethod === ('Manual Bank / UPI Transfer' as any) ||
          o.paymentMethod === 'UPI / QR Code') &&
        o.paymentStatus === 'Pending'
    ).length;

    const outOfStockProducts = INITIAL_PRODUCTS.filter((p) => p.stock <= 0).length;

    const totalRevenue = orders
      .filter(
        (o) =>
          (o.paymentStatus === 'Verified' ||
            (o.paymentMethod === 'Cash on Delivery' &&
              (o.orderStatus === 'Delivered' || o.orderStatus === 'Picked Up'))) &&
          o.orderStatus !== 'Cancelled'
      )
      .reduce((sum, o) => sum + o.grandTotal, 0);

    return {
      totalProducts,
      totalOrders,
      newOrders,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      readyForPickupOrders,
      outForDeliveryOrders,
      pickedUpOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers: uniqueCustomers || 4,
      paymentVerificationPending,
      outOfStockProducts,
      totalRevenue,
    };
  };

  const computedStats = {
    totalRevenue: orders
      .filter(
        (o) =>
          (o.paymentStatus === 'Verified' ||
            (o.paymentMethod === 'Cash on Delivery' &&
              (o.orderStatus === 'Delivered' || o.orderStatus === 'Picked Up'))) &&
          o.orderStatus !== 'Cancelled'
      )
      .reduce((sum, o) => sum + o.grandTotal, 0),
    totalOrders: orders.length,
    pendingFulfillment: orders.filter(
      (o) =>
        o.orderStatus === 'Order Placed' ||
        o.orderStatus === 'Accepted' ||
        o.orderStatus === 'Preparing at Store' ||
        o.orderStatus === 'Preparing'
    ).length,
    readyForPickup: orders.filter(
      (o) => o.orderStatus === 'Ready for Pickup' || o.orderStatus === 'Out for Delivery'
    ).length,
    outForDelivery: orders.filter(
      (o) => o.orderStatus === 'Ready for Pickup' || o.orderStatus === 'Out for Delivery'
    ).length,
    pickedUpOrders: orders.filter(
      (o) => o.orderStatus === 'Picked Up' || o.orderStatus === 'Delivered'
    ).length,
    deliveredOrders: orders.filter(
      (o) => o.orderStatus === 'Picked Up' || o.orderStatus === 'Delivered'
    ).length,
    pendingPaymentVerification: orders.filter(
      (o) => o.paymentMethod !== 'Cash on Delivery' && o.paymentStatus === 'Pending'
    ).length,
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        createOrder,
        getOrderById,
        updateOrderStatus,
        verifyPayment,
        uploadPaymentReceipt,
        addInternalAdminNote,
        addOrderNote,
        stats: computedStats,
        getDashboardStats,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
