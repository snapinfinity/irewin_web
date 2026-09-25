import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailView } from "@/components/JobDetailView";
import { getFreeJobIds, getPublishedJob, getPublishedJobs } from "@/lib/data/jobs";

export const revalidate = 60;

// Pages are generated on first visit, then refreshed every minute.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [job, jobs] = await Promise.all([getPublishedJob(id), getPublishedJobs()]);
  if (!job) return { title: "Job not found" };
  // Locked jobs don't reveal their title in metadata.
  return { title: getFreeJobIds(jobs).includes(id) ? `${job.title} – ${job.companyName}` : "Premium job" };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, jobs] = await Promise.all([getPublishedJob(id), getPublishedJobs()]);
  if (!job) notFound();
  const freeIds = getFreeJobIds(jobs);
  return <JobDetailView job={job} isFreePreview={freeIds.includes(job.id)} lockedTotal={Math.max(jobs.length - freeIds.length, 0)} />;
}
