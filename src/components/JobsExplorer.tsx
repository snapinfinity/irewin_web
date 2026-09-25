"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { GatedJobGrid } from "@/components/GatedJobGrid";
import { findCategory } from "@/lib/data/categories";
import { primaryLocation } from "@/lib/data/jobs";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import type { Category, Job } from "@/lib/types";

type FilterKey = "category" | "subcategory" | "location" | "workMode" | "employmentType" | "experienceLevel";

function matchesLocation(jobLocation: string, filter: string) {
  return primaryLocation(jobLocation).toLowerCase() === filter.toLowerCase();
}

export function JobsExplorer({
  jobs,
  categories,
  locations,
  freeIds,
}: {
  jobs: Job[];
  categories: Category[];
  locations: string[];
  freeIds: string[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get("q") ?? "";
  const f: Record<FilterKey, string> = {
    category: params.get("category") ?? "",
    subcategory: params.get("subcategory") ?? "",
    location: params.get("location") ?? "",
    workMode: params.get("workMode") ?? "",
    employmentType: params.get("employmentType") ?? "",
    experienceLevel: params.get("experienceLevel") ?? "",
  };
  const category = findCategory(categories, f.category);

  function update(changes: Partial<Record<FilterKey | "q", string>>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if ("category" in changes) next.delete("subcategory");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const term = q.trim().toLowerCase();
  const results = jobs.filter((j) => {
      if (term && ![j.title, j.companyName, j.location, j.categoryName, j.subcategoryName ?? "", ...j.skills].some((s) => s.toLowerCase().includes(term))) return false;
      if (f.category && j.category !== f.category) return false;
      if (f.subcategory && j.subcategory !== f.subcategory) return false;
      if (f.location && !matchesLocation(j.location, f.location)) return false;
      if (f.workMode && j.workMode !== f.workMode) return false;
      if (f.employmentType && j.employmentType !== f.employmentType) return false;
      if (f.experienceLevel && j.experienceLevel !== f.experienceLevel) return false;
      return true;
  });

  const active: { key: FilterKey | "q"; label: string }[] = [];
  if (q) active.push({ key: "q", label: `“${q}”` });
  if (category) active.push({ key: "category", label: category.name });
  if (f.subcategory) {
    const s = category?.subcategories.find((x) => x.slug === f.subcategory);
    if (s) active.push({ key: "subcategory", label: s.name });
  }
  if (f.location) active.push({ key: "location", label: f.location });
  if (f.workMode) active.push({ key: "workMode", label: WORK_MODE_LABELS[f.workMode as keyof typeof WORK_MODE_LABELS] ?? f.workMode });
  if (f.employmentType)
    active.push({ key: "employmentType", label: EMPLOYMENT_TYPE_LABELS[f.employmentType as keyof typeof EMPLOYMENT_TYPE_LABELS] ?? f.employmentType });
  if (f.experienceLevel)
    active.push({ key: "experienceLevel", label: EXPERIENCE_LEVEL_LABELS[f.experienceLevel as keyof typeof EXPERIENCE_LEVEL_LABELS] ?? f.experienceLevel });

  const selectCls =
    "h-11 w-full appearance-none rounded-xl border border-line bg-white px-3 text-[15px] text-ink focus:border-brand-600 focus:outline-none";

  const filters = (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Category
        <select className={selectCls} value={f.category} onChange={(e) => update({ category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {category && (
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Subcategory
          <select className={selectCls} value={f.subcategory} onChange={(e) => update({ subcategory: e.target.value })}>
            <option value="">All {category.name}</option>
            {category.subcategories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Location
        <select className={selectCls} value={f.location} onChange={(e) => update({ location: e.target.value })}>
          <option value="">All Ireland</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-ink">Work mode</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WORK_MODE_LABELS).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={f.workMode === v}
              onClick={() => update({ workMode: f.workMode === v ? "" : v })}
              className={clsx(
                "h-10 rounded-full border px-4 text-sm font-medium transition",
                f.workMode === v ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink-2 hover:border-brand-600",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Employment type
        <select className={selectCls} value={f.employmentType} onChange={(e) => update({ employmentType: e.target.value })}>
          <option value="">Any type</option>
          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
        Experience level
        <select className={selectCls} value={f.experienceLevel} onChange={(e) => update({ experienceLevel: e.target.value })}>
          <option value="">Any level</option>
          {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:gap-8 lg:py-10">
      {/* Desktop sidebar */}
      <aside aria-label="Filters" className="hidden w-72 shrink-0 self-start rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28 lg:block">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <SlidersHorizontal className="h-5 w-5 text-brand-600" /> Filters
          </h2>
          {active.length > 0 && (
            <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="text-sm font-semibold text-brand-600">
              Clear all
            </button>
          )}
        </div>
        {filters}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("q");
            update({ q: typeof value === "string" ? value : "" });
          }}
          className="flex gap-2"
        >
          <label className="relative flex flex-1 items-center">
            <span className="sr-only">Search jobs</span>
            <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
            <input
              key={q}
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Job title, skills or company"
              className="h-12 w-full rounded-xl border border-line bg-white pl-12 pr-4 text-base focus:border-brand-600 focus:outline-none"
            />
          </label>
          <button type="submit" className="h-12 rounded-xl bg-brand-600 px-5 font-display font-semibold text-white hover:bg-brand-700">
            Search
          </button>
        </form>

        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white font-semibold text-ink"
          >
            <SlidersHorizontal className="h-5 w-5 text-brand-600" />
            {showFilters ? "Hide filters" : `Filters${active.length ? ` (${active.length})` : ""}`}
          </button>
          {showFilters && <div className="mt-3 rounded-2xl border border-line bg-white p-5">{filters}</div>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted">
            <strong className="font-display text-xl text-ink">{results.length}</strong> job{results.length === 1 ? "" : "s"} found
          </p>
        </div>

        {active.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {active.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => update({ [a.key]: "" })}
                aria-label={`Remove filter ${a.label}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 pl-3.5 pr-2.5 text-sm font-medium text-brand-600"
              >
                {a.label} <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-display text-lg font-semibold">No jobs match these filters</p>
            <p className="mt-1 text-muted">Try removing a filter or searching for something broader.</p>
          </div>
        ) : (
          <GatedJobGrid jobs={results} freeIds={freeIds} columns="one" maxLockedPreview={4} />
        )}
      </div>
    </div>
  );
}
