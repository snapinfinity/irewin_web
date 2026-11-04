"use client";

import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { useSyncExternalStore } from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase-client";

/**
 * Jobs the signed-in visitor has applied to: users/{uid}/applications/{jobId},
 * written when they click through to the company's application page. One live
 * listener per session (not one read per job card), so the "Applied" marks
 * stay in sync across tabs and devices. Firestore rules only let a user see
 * and change their own records.
 */

/** jobId → appliedAt (ISO). Empty until loaded and when signed out. */
type Applied = ReadonlyMap<string, string>;

const EMPTY: Applied = new Map();
let state: Applied = EMPTY;
let started = false;
let unsubApps: (() => void) | null = null;
const listeners = new Set<() => void>();

const appsCollection = (uid: string) => collection(getClientDb(), "users", uid, "applications");

function emit(next: Applied) {
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  onAuthStateChanged(getClientAuth(), (fbUser) => {
    unsubApps?.();
    unsubApps = null;
    emit(EMPTY);
    if (!fbUser) return;
    unsubApps = onSnapshot(
      appsCollection(fbUser.uid),
      (snap) => {
        const next = new Map<string, string>();
        snap.forEach((d) => {
          const at = d.get("appliedAt");
          // serverTimestamp() is null in the local echo of a fresh write — treat it as "now".
          next.set(d.id, at instanceof Timestamp ? at.toDate().toISOString() : new Date().toISOString());
        });
        emit(next);
      },
      (err) => console.error("[IREWIN] Could not read your applications — are the Firestore rules deployed?", err),
    );
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** All of the visitor's applications (empty when signed out). */
export function useAppliedJobs(): Applied {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/** When the visitor applied to this job (ISO), or null. */
export function useAppliedAt(jobId: string): string | null {
  return useAppliedJobs().get(jobId) ?? null;
}

export async function markApplied(jobId: string) {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid || state.has(jobId)) return;
  await setDoc(doc(appsCollection(uid), jobId), { jobId, appliedAt: serverTimestamp() });
}

export async function unmarkApplied(jobId: string) {
  const uid = getClientAuth().currentUser?.uid;
  if (!uid) return;
  await deleteDoc(doc(appsCollection(uid), jobId));
}
