"use client";

import { clsx } from "clsx";
import { CircleCheck } from "lucide-react";
import { useAppliedAt } from "@/lib/applications-client";

/** "Applied" marker for a job the signed-in visitor has applied to; renders nothing otherwise. */
export function AppliedBadge({ jobId, className }: { jobId: string; className?: string }) {
  const appliedAt = useAppliedAt(jobId);
  if (!appliedAt) return null;
  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-brand-600 px-3 text-[13px] font-semibold text-white",
        className,
      )}
    >
      <CircleCheck className="h-3.5 w-3.5" /> Applied
    </span>
  );
}
