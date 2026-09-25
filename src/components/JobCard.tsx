import Link from "next/link";
import { ArrowRight, Calendar, Lock, MapPin } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { formatDate, formatSalaryRange } from "@/lib/format";
import type { Job } from "@/lib/types";

export function JobCard({ job, free = false }: { job: Job; free?: boolean }) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.currency);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-card sm:p-6"
    >
      <div className="flex items-start gap-3.5">
        <CompanyLogo name={job.companyName} logoURL={job.companyLogoURL} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug text-ink group-hover:text-brand-600">{job.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">{job.companyName}</p>
        </div>
        {free && <Badge tone="gold" className="hidden sm:inline-flex">Free preview</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          Posted {formatDate(job.createdAt)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>{WORK_MODE_LABELS[job.workMode]}</Badge>
        <Badge tone="gray">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
        <Badge tone="gray">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <span className="font-display text-[15px] font-semibold text-dark">{salary}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          View job <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Placeholder for a job the visitor can't see yet. It deliberately renders
 * NO real job data (only shimmer bars), so locked listings can't be read from
 * the page source.
 */
export function LockedJobCard({ index = 0 }: { index?: number }) {
  const widths = ["w-3/4", "w-2/3", "w-4/5", "w-3/5"];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 sm:p-6" aria-hidden="true">
      <div className="pointer-events-none select-none blur-[3px]">
        <div className="flex items-start gap-3.5">
          <div className="h-[52px] w-[52px] shrink-0 rounded-xl bg-brand-50" />
          <div className="flex-1 space-y-2 pt-1">
            <div className={`h-4 rounded bg-slate-300 ${widths[index % 4]}`} />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
        <div className="mt-5 flex gap-4">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-20 rounded-full bg-brand-50" />
          <div className="h-7 w-20 rounded-full bg-slate-100" />
          <div className="h-7 w-24 rounded-full bg-slate-100" />
        </div>
        <div className="mt-5 flex justify-between border-t border-line pt-4">
          <div className="h-4 w-36 rounded bg-slate-300" />
          <div className="h-4 w-20 rounded bg-brand-100" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/30">
        <span className="flex items-center gap-2 rounded-full bg-dark px-4 py-2 text-sm font-semibold text-white shadow-lg">
          <Lock className="h-4 w-4 text-accent" /> Premium job
        </span>
      </div>
    </div>
  );
}
