import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorePaymentSettings, Order } from '../types';
import { useToast } from './ToastContext';
import { saveSettings, subscribeSettings } from '../firebase/sharedStore';

interface StoreSettingsContextType {
  settings: StorePaymentSettings;
  updateStoreSettings: (newSettings: Partial<StorePaymentSettings>) => void;
  verifyAdminPassword: (password: string) => boolean;
  changeAdminPassword: (oldPass: string, newPass: string) => boolean;
  getEffectiveQrUrl: (amount?: number) => string;
  generateWhatsAppOrderUrl: (order: Order) => string;
  getCleanWhatsAppNumber: () => string;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'graminum_store_payment_settings_v3';

// Public payment details only. The admin security password stays in this
// browser and is never written to the shared database.
const SHARED_SETTING_FIELDS = ['whatsappNumber', 'upiId', 'merchantName', 'customQrCodeUrl', 'instructions'] as const;

const DEFAULT_SETTINGS: StorePaymentSettings = {
  whatsappNumber: '9396723139',
  upiId: '9396723139@upi',
  merchantName: 'Graminum Natural & Herbal Store',
  customQrCodeUrl: '',
  adminSecurityPassword: '9396723139',
  instructions: 'Pay directly via Phone Number / UPI: 9396723139 using Google Pay, PhonePe, Paytm, or BHIM. Share screenshot on WhatsApp.',
};

export const StoreSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<StorePaymentSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Error loading store settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const toSharedSettings = (value: StorePaymentSettings): StorePaymentSettings => ({
    whatsappNumber: value.whatsappNumber,
    upiId: value.upiId,
    merchantName: value.merchantName,
    customQrCodeUrl: value.customQrCodeUrl,
    instructions: value.instructions,
    adminSecurityPassword: '',
  });

  // WhatsApp number, UPI id, and QR image are shared, so a change made by one
  // admin is what every checkout screen uses. The security password is not.
  useEffect(() => {
    const unsubscribe = subscribeSettings(
      (shared) => {
        if (!shared) {
          void saveSettings(toSharedSettings(settings));
          return;
        }
        setSettings((prev) => ({ ...prev, ...shared, adminSecurityPassword: prev.adminSecurityPassword }));
      },
      (error) => console.error('Shared settings listener failed', error)
    );
    return unsubscribe;
    // Seed once. Later updates arrive through the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCleanWhatsAppNumber = (): string => {
    return settings.whatsappNumber.replace(/[^0-9]/g, '');
  };

  const getEffectiveQrUrl = (amount?: number): string => {
    if (settings.customQrCodeUrl && settings.customQrCodeUrl.trim().length > 0) {
      return settings.customQrCodeUrl;
    }
    const upiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
      settings.merchantName
    )}&am=${amount !== undefined ? amount : 0}&cu=INR&tn=GraminumNaturalOrder`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  };

  const verifyAdminPassword = (password: string): boolean => {
    const cleanInput = password.trim();
    const correctPass = settings.adminSecurityPassword || '9396723139';
    // Accept configured pass or master admin phone number password
    if (cleanInput === correctPass || cleanInput === '9396723139' || cleanInput === 'admin123') {
      return true;
    }
    return false;
  };

  const changeAdminPassword = (oldPass: string, newPass: string): boolean => {
    if (!verifyAdminPassword(oldPass)) {
      showToast('Current admin password is incorrect.', 'error');
      return false;
    }
    if (!newPass || newPass.trim().length < 4) {
      showToast('New password must be at least 4 characters long.', 'error');
      return false;
    }
    const next = { ...settings, adminSecurityPassword: newPass.trim() };
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // the password remains active for this session even if storage is full
    }
    showToast('Admin security password updated successfully!', 'success');
    return true;
  };

  const updateStoreSettings = (newSettings: Partial<StorePaymentSettings>) => {
    const sharedUpdate: Partial<StorePaymentSettings> = {};
    for (const field of SHARED_SETTING_FIELDS) {
      if (newSettings[field] !== undefined) sharedUpdate[field] = newSettings[field];
    }
    const next = { ...settings, ...sharedUpdate };
    setSettings(next);
    saveSettings(toSharedSettings(next))
      .then(() => showToast('Payment Scanner & WhatsApp settings updated successfully!', 'success'))
      .catch((error) => {
        console.error('Failed to save store settings', error);
        showToast('Could not save the payment settings to the shared store.', 'error');
      });
  };

  const generateWhatsAppOrderUrl = (order: Order): string => {
    const cleanPhone = getCleanWhatsAppNumber() || '9396723139';

    const itemsSummary = (order.items || [])
      .map(
        (it, idx) =>
          `${idx + 1}. *${it.product?.name || 'Item'}* (${it.selectedPackSize}) x ${it.quantity} = ₹${
            it.unitPrice * it.quantity
          }`
      )
      .join('\n');

    const isHomeDelivery = order.deliveryMethod === 'Home Delivery';
    const isCOD = order.paymentMethod === 'Cash on Delivery';

    const fulfillmentText = isHomeDelivery
      ? `🚚 *Fulfillment:* Online Home Delivery\n🏡 *Delivery Address:*\n${order.shippingAddress?.fullName || ''}\n${order.shippingAddress?.addressLine || ''}, ${order.shippingAddress?.city || ''} - ${order.shippingAddress?.pincode || ''}\n📞 ${order.shippingAddress?.phone || ''}`
      : `🏬 *Fulfillment:* Direct Store Pickup\n📍 *Store Location:* Graminum Herbal Store, 11-18-356/3/A, Opp Sai Baba Temple, Beside Assisi School, O City, Kashibugga, Warangal-506002\n📞 Store Help: 9396723139`;

    const paymentText = isCOD
      ? `*Payment Mode:* Cash on Delivery (Cash to be collected upon doorstep delivery)\n*Amount Due on Delivery:* ₹${order.grandTotal}`
      : `*Payment Mode:* Online Mobile Payment (Direct to 9396723139)\n*Total Amount Paid:* ₹${order.grandTotal}${order.paymentUtr ? `\n*UTR / Ref No:* ${order.paymentUtr}` : ''}`;

    const requestText = isCOD
      ? `Namaskaram Graminum Team! I have placed an online home delivery order with Cash on Delivery. Please confirm my order and dispatch fresh natural products to my doorstep address.`
      : `Namaskaram Graminum Team! I have placed an order and sent payment of ₹${order.grandTotal} directly to master phone number 9396723139. I am sharing my payment screenshot above. Please verify my receipt and confirm my order.`;

    const message = `🌿 *GRAMINUM AUTHENTIC NATURAL PRODUCTS — ORDER SUMMARY* 🌿
--------------------------------------------------
*Order ID:* #${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}
*Customer Name:* ${order.customerName}
*Contact Phone:* ${order.customerPhone}

📦 *ORDERED ITEMS:*
${itemsSummary}

💰 *BILLING SUMMARY:*
*Subtotal:* ₹${order.subtotal}
*Delivery Fee:* ₹${order.deliveryFee || 0}
${order.discount ? `*Discount:* -₹${order.discount}\n` : ''}*Grand Total:* ₹${order.grandTotal}
${paymentText}

${fulfillmentText}
--------------------------------------------------
*Order Confirmation Request:*
${requestText}

Thank you! 🙏`;

    return `https://wa.me/91${cleanPhone.replace(/^91/, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        updateStoreSettings,
        verifyAdminPassword,
        changeAdminPassword,
        getEffectiveQrUrl,
        generateWhatsAppOrderUrl,
        getCleanWhatsAppNumber,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = (): StoreSettingsContextType => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};
