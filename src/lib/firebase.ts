import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const getValidEnv = (val: any) => {
  if (typeof val === 'string') {
    let clean = val.trim();
    // Strip surrounding quotes if present
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    if (
      clean !== '' && 
      clean !== 'undefined' && 
      clean !== 'null' && 
      !clean.includes('YOUR_') &&
      clean.length >= 10
    ) {
      return clean;
    }
  }
  return null;
};

const config = {
  apiKey: getValidEnv(import.meta.env.VITE_FIREBASE_API_KEY) || firebaseConfigRaw.apiKey,
  authDomain: getValidEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfigRaw.authDomain,
  projectId: getValidEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID) || firebaseConfigRaw.projectId,
  storageBucket: getValidEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfigRaw.storageBucket,
  messagingSenderId: getValidEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfigRaw.messagingSenderId,
  appId: getValidEnv(import.meta.env.VITE_FIREBASE_APP_ID) || firebaseConfigRaw.appId,
  firestoreDatabaseId: getValidEnv(import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || (firebaseConfigRaw as any).firestoreDatabaseId
};

// Diagnostic check
if (!config.apiKey || config.apiKey === 'undefined') {
  console.error('Firebase API Key is missing. Environment variables starting with VITE_ must be set in your deployment platform (e.g. Vercel) and the app must be redeployed.');
} else if (config.apiKey.length < 10) {
  console.error('Firebase API Key is invalid (too short). Even the fallback config seems broken.');
} else {
  // If we reach here, we have a key >= 10 chars. 
  // Let's log if we are using the fallback or the env var for debugging.
  const isUsingEnv = getValidEnv(import.meta.env.VITE_FIREBASE_API_KEY) !== null;
  if (!isUsingEnv) {
    console.warn('Using local firebase-applet-config.json for Firebase configuration because VITE_ environment variables are missing or invalid.');
  }
}

const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);
