import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="text-muted">The job may have closed or the link may be wrong.</p>
      <Link href="/jobs" className="rounded-xl bg-brand-600 px-6 py-3 font-display font-semibold text-white hover:bg-brand-700">
        Browse jobs
      </Link>
    </div>
  );
}
