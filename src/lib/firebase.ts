import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore/lite";

/**
 * Same Firebase project as the admin dashboard. The public site only READS,
 * anonymously — Firestore rules allow published jobs, categories and companies.
 * Uses the lightweight REST-based Firestore client, which suits server rendering.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Copy .env.local.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values.");
  }
  if (!db) {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

/** Firestore Timestamp (or anything with toDate) → ISO string, so data can pass to client components. */
export function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}
