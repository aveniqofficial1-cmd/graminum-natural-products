import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { Order, Product, StorePaymentSettings } from '../types';

/**
 * Shared store database.
 *
 * Orders, the catalog, and payment settings live in Firestore. Every browser
 * subscribes with onSnapshot, so an order placed on one device appears on
 * every admin and manager session without a refresh.
 *
 * Writes go directly from the browser. The project is on the free Spark plan,
 * which cannot run the trusted writer function, and staff sign in through the
 * app's own login rather than Firebase Auth. The rules restrict writes to the
 * three store collections and require the document's own id to match.
 */
export const SHARED_COLLECTIONS = {
  orders: 'orders',
  products: 'products',
  settings: 'settings',
} as const;

const SETTINGS_DOC_ID = 'store';

// Firestore rejects undefined values, and it silently drops empty arrays on
// write. An order with no items would then come back without an items field
// and crash every screen that reads items.length. Empty arrays are kept as a
// single null entry, which readers already skip.
const stripUndefined = <T>(value: T): T => {
  const json = JSON.stringify(value, (_key, item) => {
    if (Array.isArray(item) && item.length === 0) return [null];
    return item;
  });
  const restore = (item: unknown): unknown => {
    if (Array.isArray(item)) {
      return item.length === 1 && item[0] === null ? [] : item.map(restore);
    }
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([key, entry]) => [key, restore(entry)])
      );
    }
    return item;
  };
  return restore(JSON.parse(json)) as T;
};

const writeDoc = async (collectionName: string, docId: string, data: unknown): Promise<void> => {
  try {
    await setDoc(doc(db, collectionName, docId), stripUndefined(data));
  } catch (error) {
    console.error(`Shared store write failed for ${collectionName}/${docId}`, error);
    throw new Error('Could not save to the shared store. Check your internet connection and try again.');
  }
};

const removeDoc = async (collectionName: string, docId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Shared store delete failed for ${collectionName}/${docId}`, error);
    throw new Error('Could not update the shared store. Check your internet connection and try again.');
  }
};

export const saveOrder = (order: Order): Promise<void> =>
  writeDoc(SHARED_COLLECTIONS.orders, order.id, order);

export const saveProduct = (product: Product): Promise<void> =>
  writeDoc(SHARED_COLLECTIONS.products, product.id, product);

export const removeProduct = (productId: string): Promise<void> =>
  removeDoc(SHARED_COLLECTIONS.products, productId);

export const saveSettings = (settings: StorePaymentSettings): Promise<void> =>
  writeDoc(SHARED_COLLECTIONS.settings, SETTINGS_DOC_ID, settings);

export const subscribeOrders = (
  onChange: (orders: Order[]) => void,
  onError: (error: Error) => void
): Unsubscribe =>
  onSnapshot(
    query(collection(db, SHARED_COLLECTIONS.orders)),
    (snapshot) => {
      const orders = snapshot.docs.map((item) => item.data() as Order);
      orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onChange(orders);
    },
    (error) => onError(error)
  );

export const subscribeProducts = (
  onChange: (products: Product[]) => void,
  onError: (error: Error) => void
): Unsubscribe =>
  onSnapshot(
    query(collection(db, SHARED_COLLECTIONS.products)),
    (snapshot) => {
      const products = snapshot.docs.map((item) => item.data() as Product);
      products.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onChange(products);
    },
    (error) => onError(error)
  );

export const subscribeSettings = (
  onChange: (settings: StorePaymentSettings | null) => void,
  onError: (error: Error) => void
): Unsubscribe =>
  onSnapshot(
    doc(db, SHARED_COLLECTIONS.settings, SETTINGS_DOC_ID),
    (snapshot) => {
      onChange(snapshot.exists() ? (snapshot.data() as StorePaymentSettings) : null);
    },
    (error) => onError(error)
  );

/** Copies this browser's older local data up once. Existing ids are overwritten with the same content, so repeats do not duplicate anything. */
export const migrateDocument = (
  collectionName: string,
  docId: string,
  data: unknown
): Promise<void> => writeDoc(collectionName, docId, data);
