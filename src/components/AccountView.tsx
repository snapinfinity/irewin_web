"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CircleCheck, Crown, LogOut, Mail } from "lucide-react";
import { useSession } from "@/lib/auth/useSession";
import { getPlan } from "@/lib/data/plans";
import { formatDate } from "@/lib/format";
import { FREE_JOB_PREVIEW_COUNT } from "@/lib/constants";

export function AccountView() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile, membership, isPremium, signOut, cancelMembership, setMarketingOptIn } = useSession();
  const [savingPrefs, setSavingPrefs] = useState(false);
  const plan = getPlan(membership?.planId);
  const activated = params.get("activated") === "1";

  return (
    <div className="container-page flex max-w-3xl flex-col gap-6 py-10 sm:py-14">
      {activated && isPremium && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-700">
          <CircleCheck className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="font-display text-lg font-semibold">Premium unlocked!</p>
            <p className="text-[15px]">Every job is now visible and you can apply directly with employers.</p>
            <Link href="/jobs" className="mt-2 inline-block font-semibold underline">
              Browse all jobs
            </Link>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">My account</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google profile photo
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 font-display text-xl font-bold text-brand-600">
            {user?.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1">
          <p className="font-display text-lg font-semibold">{user?.name}</p>
          <p className="text-muted">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 font-semibold text-ink-2 hover:bg-surface"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      {profile && (
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-lg font-semibold">Account details</h2>
          <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Signed in with</dt>
              <dd className="font-semibold">Google{profile.emailVerified ? " · email verified" : ""}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Member since</dt>
              <dd className="font-semibold">{formatDate(profile.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Last sign-in</dt>
              <dd className="font-semibold">{formatDate(profile.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Sign-ins</dt>
              <dd className="font-semibold">{profile.loginCount}</dd>
            </div>
          </dl>
        </section>
      )}

      {profile && (
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5 text-brand-600" /> Email preferences
          </h2>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink-2">
            <input
              type="checkbox"
              checked={profile.marketingOptIn}
              disabled={savingPrefs}
              onChange={async (e) => {
                setSavingPrefs(true);
                await setMarketingOptIn(e.target.checked);
                setSavingPrefs(false);
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-[#0f766e]"
            />
            <span>
              Send me new jobs, career tips and IREWIN offers by email.
              {profile.marketingOptIn && profile.marketingOptInAt && (
                <span className="block text-sm text-muted">Subscribed on {formatDate(profile.marketingOptInAt)}.</span>
              )}
            </span>
          </label>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Crown className="h-5 w-5 text-amber-600" /> Membership
        </h2>
        {isPremium && membership ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted">Plan</dt>
                <dd className="font-semibold">Premium · {plan?.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Started</dt>
                <dd className="font-semibold">{formatDate(membership.startedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Active until</dt>
                <dd className="font-semibold">{formatDate(membership.expiresAt)}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/premium" className="flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700">
                Extend membership
              </Link>
              <button
                type="button"
                onClick={() => cancelMembership()}
                className="flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-semibold text-muted hover:bg-surface"
              >
                Remove Premium (test)
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted">You&apos;re on the free plan. You can see {FREE_JOB_PREVIEW_COUNT} preview jobs; Premium unlocks every job and the apply button.</p>
            <Link href="/premium" className="flex h-11 w-fit items-center gap-2 rounded-xl bg-accent px-5 font-display font-semibold text-dark hover:bg-accent-soft">
              <Crown className="h-4 w-4" /> See Premium plans
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
