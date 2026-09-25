import type { Metadata } from "next";
import { Suspense } from "react";
import { JobsExplorer } from "@/components/JobsExplorer";
import { getCategories } from "@/lib/data/categories";
import { getFreeJobIds, getLocations, getPublishedJobs } from "@/lib/data/jobs";

export const metadata: Metadata = { title: "Find jobs in Ireland" };

export const revalidate = 60;

export default async function JobsPage() {
  const [jobs, categories] = await Promise.all([getPublishedJobs(), getCategories()]);
  return (
    <>
      <section className="bg-dark">
        <div className="container-page py-10 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Jobs in Ireland</h1>
          <p className="mt-3 max-w-2xl text-on-dark sm:text-lg">
            Search roles from employers across the country. Premium members see and apply to every listing.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="container-page py-10 text-muted">Loading jobs…</div>}>
        <JobsExplorer
          jobs={jobs}
          categories={categories}
          locations={getLocations(jobs).map((l) => l.name)}
          freeIds={getFreeJobIds(jobs)}
        />
      </Suspense>
    </>
  );
}
