import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  linkWithPopup,
  signOut as fbSignOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  reauthenticateWithPopup,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage 
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Explicitly set browserLocalPersistence to guarantee session persistence across page reloads
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence warning:', err);
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

export const calendarGoogleProvider = new GoogleAuthProvider();
calendarGoogleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
calendarGoogleProvider.setCustomParameters({
  prompt: 'select_account'
});

const rawConfig = firebaseConfig as Record<string, any>;

export const db: Firestore = rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);

export const storage: FirebaseStorage = getStorage(app);

export async function waitForAuthReady(): Promise<User | null> {
  if (typeof (auth as any).authStateReady === 'function') {
    await (auth as any).authStateReady();
  }
  return auth.currentUser;
}

let isSigningIn = false;

export async function signInWithGoogle(): Promise<User> {
  if (isSigningIn) {
    throw new Error('A sign-in window is already open. Please complete or close it.');
  }
  isSigningIn = true;
  try {
    if (typeof window !== 'undefined') {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
    }
    const result = await signInWithPopup(auth, googleProvider);
    
    // Automatically capture Google Calendar access token on login
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken && typeof window !== 'undefined') {
      sessionStorage.setItem('inkwell_gcal_token', accessToken);
      if (result.user?.email) {
        sessionStorage.setItem('inkwell_gcal_email', result.user.email);
      }
    }
    
    return result.user;
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn('Google Sign-In note:', error?.message || error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign in as an Anonymous Guest using Firebase Anonymous Authentication.
 * Gives the user a unique request.auth.uid for isolated Firestore access without a Google account.
 */
let isGuestSigningIn = false;
export async function signInAsGuest(): Promise<User> {
  if (isGuestSigningIn) {
    throw new Error('A guest session is already starting.');
  }
  isGuestSigningIn = true;
  try {
    if (typeof window !== 'undefined') {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
    }
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/admin-restricted-operation') {
      const helpfulError = new Error('Anonymous sign-in is disabled in this Firebase project. Please use "Sign in with Google" or enable Anonymous sign-in in your Firebase Console (Authentication > Sign-in method).');
      (helpfulError as any).code = 'auth/admin-restricted-operation';
      throw helpfulError;
    }
    console.error('Anonymous Guest Sign-in error:', error);
    throw error;
  } finally {
    isGuestSigningIn = false;
  }
}

/**
 * Links an active anonymous guest account with a Google account.
 * Keeps all existing journal entries, settings, and UID intact while attaching a permanent Google identity.
 */
let isLinkingAccount = false;
export async function linkGuestWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
  if (!auth.currentUser) {
    throw new Error('No active guest session found to link.');
  }
  if (!auth.currentUser.isAnonymous) {
    throw new Error('This account is already linked to a permanent provider.');
  }
  if (isLinkingAccount) {
    throw new Error('An account linking window is already open.');
  }
  isLinkingAccount = true;
  try {
    const result = await linkWithPopup(auth.currentUser, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken && typeof window !== 'undefined') {
      sessionStorage.setItem('inkwell_gcal_token', accessToken);
      if (result.user?.email) {
        sessionStorage.setItem('inkwell_gcal_email', result.user.email);
      }
    }
    return { user: result.user, accessToken };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn('Account linking error:', error);
    }
    throw error;
  } finally {
    isLinkingAccount = false;
  }
}

/**
 * Secondary OAuth consent for Google Calendar or switching to a different Google account.
 * Allows user to connect another Google Calendar account if desired.
 */
let isRequestingCalendar = false;
export async function requestGoogleCalendarAccess(): Promise<{ user: User | null; accessToken: string | null }> {
  if (isRequestingCalendar) {
    throw new Error('A Google Calendar authorization window is already open.');
  }
  isRequestingCalendar = true;
  try {
    // Open popup allowing user to choose any Google account (same or different)
    const result = await signInWithPopup(auth, calendarGoogleProvider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken && typeof window !== 'undefined') {
      sessionStorage.setItem('inkwell_gcal_token', accessToken);
      if (result.user?.email) {
        sessionStorage.setItem('inkwell_gcal_email', result.user.email);
      }
    }
    return { user: result.user || auth.currentUser, accessToken };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.warn('Google Calendar authorization note:', error?.message || error);
    }
    throw error;
  } finally {
    isRequestingCalendar = false;
  }
}

export function getStoredCalendarToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('inkwell_gcal_token');
}

export function getStoredCalendarEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('inkwell_gcal_email');
}

export function clearStoredCalendarToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('inkwell_gcal_token');
  sessionStorage.removeItem('inkwell_gcal_email');
}

export async function logOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error: unknown) {
    console.error('Error signing out:', error);
    throw error;
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
