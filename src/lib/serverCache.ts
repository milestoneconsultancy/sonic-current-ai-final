import { db, markFirestoreDisabled, isFirestoreDisabled as checkIsDisabled } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const memoryFallback = new Map<string, { value: any; expiresAt: number }>();

function handleFirestoreError(err: any) {
  const msg = String(err?.message || err || '');
  const code = String(err?.code || '');
  if (
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('permission-denied') ||
    msg.includes('disabled') ||
    msg.includes('offline') ||
    code.includes('permission-denied')
  ) {
    markFirestoreDisabled();
  }
}

/**
 * Persistent serverless cache with Firestore storage & in-memory fast tier.
 * Preserves search intent, trending, and AI feature cache across Netlify cold starts.
 */
export async function getPersistentCache<T>(key: string): Promise<T | null> {
  const cleanKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);

  // 1. Fast in-memory check
  const mem = memoryFallback.get(cleanKey);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.value as T;
  }

  if (checkIsDisabled()) return null;

  // 2. Persistent Firestore check
  try {
    const docRef = doc(db, 'server_cache', cleanKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.expiresAt && Date.now() < data.expiresAt) {
        memoryFallback.set(cleanKey, { value: data.value, expiresAt: data.expiresAt });
        return data.value as T;
      }
    }
  } catch (err) {
    handleFirestoreError(err);
  }

  return null;
}

export async function setPersistentCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 1800
): Promise<void> {
  const cleanKey = key.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
  const expiresAt = Date.now() + ttlSeconds * 1000;

  memoryFallback.set(cleanKey, { value, expiresAt });

  if (checkIsDisabled()) return;

  try {
    const docRef = doc(db, 'server_cache', cleanKey);
    await setDoc(docRef, { value, expiresAt, updatedAt: Date.now() });
  } catch (err) {
    handleFirestoreError(err);
  }
}
