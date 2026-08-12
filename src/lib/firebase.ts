import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, disableNetwork } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  ...config,
  projectId: config.projectId || 'free-music-25a94',
  authDomain: config.authDomain || 'free-music-25a94.firebaseapp.com',
  databaseURL: config.databaseURL || 'https://free-music-25a94-default-rtdb.firebaseio.com/',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

let isFirestoreDisabledFlag = false;

export function isFirestoreDisabled(): boolean {
  return isFirestoreDisabledFlag;
}

export function markFirestoreDisabled() {
  if (!isFirestoreDisabledFlag) {
    isFirestoreDisabledFlag = true;
    try {
      disableNetwork(db).catch(() => {});
    } catch (_) {}
  }
}

export default app;

