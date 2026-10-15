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
 * Orders, the catalog, and payment settings are written through one locked
 * Cloud Function (submitStoreWrite). The browser never writes Firestore
 * directly. Staff and customers subscribe here and receive the same data on
 * every device.
 *
 * The write key is a store credential, not a per-user secret. It lives in the
 * Vite env at build time. Firestore rules reject every client write, so the
 * key alone cannot change data — the function checks it first.
 */
const WRITE_ENDPOINT =
  import.meta.env.VITE_STORE_WRITE_URL ||
  'https://us-central1-graminum-organic-foods.cloudfunctions.net/submitStoreWrite';

const WRITE_KEY = import.meta.env.VITE_STORE_WRITE_KEY || 'graminum-store-write-9396723139';

export const SHARED_COLLECTIONS = {
  orders: 'orders',
  products: 'products',
  settings: 'settings',
} as const;

const SETTINGS_DOC_ID = 'store';

const stripUndefined = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const writeShared = async (
  action: 'set' | 'delete',
  collectionName: string,
  docId: string,
  data?: unknown
): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(WRITE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: WRITE_KEY,
        action,
        collection: collectionName,
        docId,
        data: data === undefined ? undefined : stripUndefined(data),
      }),
    });
  } catch {
    throw new Error(
      'Could not reach the shared store. Check your internet connection and try again.'
    );
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? ` ${body.error}` : '';
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(`The shared store rejected the update.${detail}`);
  }
};

export const saveOrder = (order: Order): Promise<void> =>
  writeShared('set', SHARED_COLLECTIONS.orders, order.id, order);

export const saveProduct = (product: Product): Promise<void> =>
  writeShared('set', SHARED_COLLECTIONS.products, product.id, product);

export const removeProduct = (productId: string): Promise<void> =>
  writeShared('delete', SHARED_COLLECTIONS.products, productId);

export const saveSettings = (settings: StorePaymentSettings): Promise<void> =>
  writeShared('set', SHARED_COLLECTIONS.settings, SETTINGS_DOC_ID, settings);

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

/** One-time server writes used to copy this browser's older local data up once. */
export const migrateDocument = (
  collectionName: string,
  docId: string,
  data: unknown
): Promise<void> => writeShared('set', collectionName, docId, data);

export { deleteDoc, doc, setDoc };
