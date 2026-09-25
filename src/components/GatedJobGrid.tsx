"use client";

import { clsx } from "clsx";
import { JobCard, LockedJobCard } from "@/components/JobCard";
import { UnlockPanel } from "@/components/UnlockPanel";
import { useSession } from "@/lib/auth/useSession";
import type { Job } from "@/lib/types";

/**
 * Shows jobs according to membership:
 * - Premium: every job.
 * - Everyone else: only the free-preview jobs, then blurred placeholders and an unlock panel.
 */
export function GatedJobGrid({
  jobs,
  freeIds,
  maxLockedPreview = 3,
  columns = "three",
}: {
  jobs: Job[];
  /** IDs of the free-preview jobs (the newest few across the whole site). */
  freeIds: string[];
  maxLockedPreview?: number;
  columns?: "three" | "one";
}) {
  const { ready, isPremium } = useSession();
  const grid = clsx("grid gap-4 sm:gap-6", columns === "three" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1");

  if (!ready) {
    return (
      <div className={grid}>
        {Array.from({ length: Math.min(jobs.length, 3) || 3 }).map((_, i) => (
          <div key={i} className="h-60 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <p className="font-display text-lg font-semibold">No jobs published yet</p>
        <p className="mt-1 text-muted">New roles appear here as soon as they&apos;re published in the dashboard.</p>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className={grid}>
        {jobs.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
    );
  }

  const free = jobs.filter((j) => freeIds.includes(j.id));
  const lockedCount = jobs.length - free.length;
  const placeholders = Math.min(lockedCount, maxLockedPreview);

  return (
    <div className="flex flex-col gap-6">
      <div className={grid}>
        {free.map((j) => (
          <JobCard key={j.id} job={j} free />
        ))}
        {Array.from({ length: placeholders }).map((_, i) => (
          <LockedJobCard key={`locked-${i}`} index={i} />
        ))}
      </div>
      {lockedCount > 0 && <UnlockPanel lockedCount={lockedCount} />}
    </div>
  );
}
