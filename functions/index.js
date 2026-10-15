const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const ALLOWED_COLLECTIONS = new Set(['orders', 'products', 'settings']);

/**
 * Single trusted writer for the shared store.
 * Firestore rules deny every browser write. Staff and customers reach this
 * function instead, so an order placed on one device is stored centrally and
 * streams to every admin and manager session.
 *
 * STORE_WRITE_KEY must be set before deploy:
 *   firebase functions:secrets:set STORE_WRITE_KEY
 * or, for the default key baked into the site build:
 *   firebase functions:config is not used — set the env on the function.
 */
exports.submitStoreWrite = onRequest(
  { cors: true, invoker: 'public' },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST only' });
      return;
    }

    const expected = process.env.STORE_WRITE_KEY || 'graminum-store-write-9396723139';
    const { key, action, collection, docId, data } = req.body || {};

    if (!key || key !== expected) {
      res.status(403).json({ error: 'Rejected' });
      return;
    }
    if (!ALLOWED_COLLECTIONS.has(collection)) {
      res.status(400).json({ error: 'Unknown collection' });
      return;
    }
    if (typeof docId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(docId)) {
      res.status(400).json({ error: 'Invalid document id' });
      return;
    }
    if (collection === 'settings' && docId !== 'store') {
      res.status(400).json({ error: 'Invalid settings document' });
      return;
    }
    if (action !== 'set' && action !== 'delete') {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    try {
      const db = getFirestore();
      const ref = db.collection(collection).doc(docId);
      if (action === 'delete') {
        await ref.delete();
      } else {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          res.status(400).json({ error: 'Missing document data' });
          return;
        }
        await ref.set(data);
      }
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('submitStoreWrite failed', error);
      res.status(500).json({ error: 'Write failed' });
    }
  }
);
