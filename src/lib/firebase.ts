import { initializeApp, getApps, getApp, setLogLevel as setAppLogLevel } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel as setFirestoreLogLevel } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import config from '../../firebase-applet-config.json';

// Silence verbose/internal SDK transport connection logs
try {
  setAppLogLevel('silent');
  setFirestoreLogLevel('silent');
} catch (_) {}

// Filter benign internal Firestore idle stream timeout logs from polluting browser dev tools
if (typeof window !== 'undefined' && console && console.error) {
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const firstArg = args[0] ? String(args[0]) : '';
    if (
      firstArg.includes('Disconnecting idle stream') ||
      firstArg.includes('CANCELLED: Disconnecting idle stream') ||
      firstArg.includes('Timed out waiting for new targets')
    ) {
      // Normal internal gRPC connection idle timeout event, ignore
      return;
    }
    originalConsoleError(...args);
  };
}

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

let firestoreDisabled = false;

export function isFirestoreDisabled(): boolean {
  return firestoreDisabled;
}

export function markFirestoreDisabled() {
  firestoreDisabled = true;
}

export default app;
