import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const getFirebaseAuth = (): Auth | null => {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  }
  return auth;
};

export const initRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier | null => {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return null;

  try {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_e) {}
      recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (!container) return null;

    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved automatically
      },
      'expired-callback': () => {
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (_e) {}
          recaptchaVerifier = null;
        }
      },
    });

    return recaptchaVerifier;
  } catch (error) {
    console.warn('Firebase Recaptcha init warning:', error);
    return null;
  }
};

export const sendFirebaseOtp = async (
  fullPhoneWithCountryCode: string,
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; error?: string }> => {
  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) {
    return { success: false, error: 'Firebase is not configured in .env' };
  }

  try {
    const verifier = initRecaptcha(containerId);
    if (!verifier) {
      return { success: false, error: 'Failed to initialize invisible reCAPTCHA' };
    }

    confirmationResult = await signInWithPhoneNumber(firebaseAuth, fullPhoneWithCountryCode, verifier);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase sendOtp error:', error);
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (_e) {}
      recaptchaVerifier = null;
    }
    return {
      success: false,
      error: error.message || 'Failed to send OTP via Firebase',
    };
  }
};

export const verifyFirebaseOtp = async (
  otp: string
): Promise<{ success: boolean; user?: any; error?: string }> => {
  if (!confirmationResult) {
    return { success: false, error: 'No active OTP verification session' };
  }

  try {
    const result = await confirmationResult.confirm(otp);
    confirmationResult = null;
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error('Firebase verifyOtp error:', error);
    return {
      success: false,
      error: error.message || 'Invalid or expired OTP',
    };
  }
};
