"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  ChevronRight,
  CircleCheck,
  Crown,
  Euro,
  ExternalLink,
  House,
  Layers,
  Lock,
  MapPin,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/Badge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { UnlockPanel } from "@/components/UnlockPanel";
import { useSession } from "@/lib/auth/useSession";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { formatDate, formatSalaryRange } from "@/lib/format";
import type { Job } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-2 marker:text-brand-600">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Euro; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <p className="text-[15px] font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function ApplyBox({ job }: { job: Job }) {
  const { ready, isLoggedIn, isPremium } = useSession();
  if (!ready) return <div className="h-14 animate-pulse rounded-xl bg-slate-100" />;
  if (isPremium) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-display text-base font-semibold text-white hover:bg-brand-700"
        >
          Apply on company site <ExternalLink className="h-5 w-5" />
        </a>
        <p className="text-center text-[13px] text-muted">You&apos;ll finish your application on {job.companyName}&apos;s website.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-gold-soft p-4">
      <p className="flex items-center gap-2 font-display font-semibold text-amber-900">
        <Lock className="h-4 w-4" /> Applying is a Premium feature
      </p>
      <p className="text-sm text-amber-900/80">Upgrade to see the apply link for this and every other job.</p>
      <Link
        href={isLoggedIn ? "/premium" : "/login?next=/premium"}
        className="flex items-center justify-center gap-2 rounded-xl bg-dark px-5 py-3 font-display font-semibold text-white hover:bg-dark-2"
      >
        <Crown className="h-4 w-4 text-gold" /> {isLoggedIn ? "Unlock with Premium" : "Log in to unlock"}
      </Link>
    </div>
  );
}

export function JobDetailView({ job, isFreePreview, lockedTotal }: { job: Job; isFreePreview: boolean; lockedTotal: number }) {
  const { ready, isPremium } = useSession();
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.currency);

  if (!ready) {
    return <div className="container-page py-16"><div className="h-64 animate-pulse rounded-2xl bg-white" /></div>;
  }

  if (!isFreePreview && !isPremium) {
    return (
      <div className="container-page flex flex-col gap-6 py-10 sm:py-16">
        <Link href="/jobs" className="flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <UnlockPanel lockedCount={lockedTotal} />
      </div>
    );
  }

  return (
    <>
      <section className="bg-dark">
        <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-on-dark">
            <Link href="/jobs" className="flex items-center gap-1.5 font-medium text-white hover:text-accent">
              <ArrowLeft className="h-4 w-4" /> Jobs
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/jobs?category=${job.category}`} className="hover:text-white">
              {job.categoryName}
            </Link>
            {job.subcategoryName && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/jobs?category=${job.category}&subcategory=${job.subcategory}`} className="hover:text-white">
                  {job.subcategoryName}
                </Link>
              </>
            )}
          </nav>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <CompanyLogo name={job.companyName} logoURL={job.companyLogoURL} size={80} className="rounded-2xl" />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {isFreePreview && !isPremium && <Badge tone="gold">Free preview</Badge>}
                {isPremium && (
                  <Badge tone="gold" className="gap-1">
                    <Crown className="h-3.5 w-3.5" /> Premium
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{job.title}</h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-on-dark">
                <span className="font-medium text-white">{job.companyName}</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent" /> {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-accent" /> Posted {formatDate(job.createdAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="dark">{WORK_MODE_LABELS[job.workMode]}</Badge>
                <Badge tone="dark">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
                <Badge tone="dark">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-8 sm:py-10 lg:grid-cols-[1fr_360px] lg:gap-8">
        <div className="flex flex-col gap-6">
          <Section title="About the role">
            <p className="text-base leading-relaxed text-ink-2">{job.description}</p>
          </Section>
          <Section title="Responsibilities">
            <List items={job.responsibilities} />
          </Section>
          <Section title="Requirements">
            <List items={job.requirements} />
          </Section>
          <Section title="Benefits">
            <div className="grid gap-3 sm:grid-cols-2">
              {job.benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-[15px]">
                  <CircleCheck className="h-5 w-5 shrink-0 text-brand-600" /> {b}
                </div>
              ))}
            </div>
          </Section>
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold">Job overview</h2>
            <Row icon={Euro} label="Salary" value={salary} />
            <Row icon={Briefcase} label="Employment type" value={EMPLOYMENT_TYPE_LABELS[job.employmentType]} />
            <Row icon={House} label="Work mode" value={WORK_MODE_LABELS[job.workMode]} />
            <Row icon={TrendingUp} label="Experience level" value={EXPERIENCE_LEVEL_LABELS[job.experienceLevel]} />
            <Row icon={Layers} label="Category" value={job.subcategoryName ? `${job.categoryName} / ${job.subcategoryName}` : job.categoryName} />
            <Row icon={Calendar} label="Apply by" value={job.applicationDeadline ? formatDate(job.applicationDeadline) : "Open until filled"} />
            <ApplyBox job={job} />
          </div>
          <div className="flex gap-3 rounded-2xl bg-brand-50 p-5 text-sm leading-relaxed text-brand-700">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            This listing was reviewed by the IREWIN team. Never pay a fee to an employer to apply for a job.
          </div>
        </aside>
      </div>
    </>
  );
}
