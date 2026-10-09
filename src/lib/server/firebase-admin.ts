import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin (same project as the dashboard). Used by the
 * payment routes to verify who is paying and to write `membership`, which the
 * browser must not be trusted to do. Credentials come from
 * FIREBASE_SERVICE_ACCOUNT_JSON (Vercel) or FIREBASE_SERVICE_ACCOUNT_KEY_PATH
 * (local file). Created lazily so `next build` works without credentials.
 */
function loadServiceAccount(): Record<string, unknown> {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline) return JSON.parse(inline);
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath || !existsSync(/* turbopackIgnore: true */ keyPath)) {
    throw new Error("Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_KEY_PATH (see .env.local.example).");
  }
  return JSON.parse(readFileSync(/* turbopackIgnore: true */ keyPath, "utf-8"));
}

let app: App | undefined;

function adminApp(): App {
  app ??= getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()) });
  return app;
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

export const isAdminConfigured = () =>
  Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

/** Verifies the `Authorization: Bearer <Firebase ID token>` header sent by the signed-in browser. */
export async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}
