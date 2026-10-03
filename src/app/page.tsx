import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Crown, ShieldCheck, UserPlus } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";
import { GatedJobGrid } from "@/components/GatedJobGrid";
import { PremiumTeaser } from "@/components/PremiumTeaser";
import { SectionHead } from "@/components/SectionHead";
import { getCategories } from "@/lib/data/categories";
import { countByCategory, getFreeJobIds, getPublishedJobs } from "@/lib/data/jobs";

const STEPS = [
  { icon: UserPlus, title: "Create a free account", text: "Sign up in seconds with your email." },
  { icon: Crown, title: "Choose a Premium plan", text: "1, 3 or 6 months, or a full year." },
  { icon: ShieldCheck, title: "Unlock every job", text: "See full details and apply directly with employers." },
];

export const revalidate = 60;

export default async function HomePage() {
  const [jobs, categories] = await Promise.all([getPublishedJobs(), getCategories()]);
  const counts = countByCategory(jobs);
  // Busiest categories first on the home page.
  const topCategories = [...categories].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0)).slice(0, 4);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-dark">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[68%]">
          <Image
            src="/images/hero-dublin.svg"
            alt="Sunset over the Dublin quays"
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />
        </div>
        {/* Keeps text readable over the image: full wash on mobile, fade from the left on desktop */}
        <div className="absolute inset-0 bg-dark/80 lg:bg-transparent lg:bg-[linear-gradient(90deg,#0a3b34_0%,#0a3b34_38%,rgba(10,59,52,0.7)_58%,rgba(10,59,52,0)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-dark" />

        <div className="container-page relative flex flex-col gap-6 pb-24 pt-14 sm:pt-20 lg:min-h-[520px] lg:justify-center lg:pb-32 lg:pt-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1.5 text-sm font-medium text-accent-soft">
            <ShieldCheck className="h-4 w-4" /> Every job reviewed before it goes live
          </span>
          <h1 className="max-w-2xl text-[40px] font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your next job
            <br />
            is in <span className="text-accent">Ireland</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-on-dark sm:text-lg">
            Explore job opportunities from employers across Ireland, from Dublin to the Wild Atlantic Way, and take the
            next step in your career.
          </p>
        </div>
      </section>

      <div className="relative bg-dark pb-14">
        <div className="container-page -mt-16 flex flex-col gap-5 sm:-mt-20">
          {/* Categories */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-on-dark">Browse by category</span>
            <Link href="/categories" className="flex items-center gap-1 text-sm font-semibold text-accent hover:text-white">
              All categories <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {topCategories.map((c) => (
              <CategoryCard key={c.id} category={c} count={counts[c.slug] ?? 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Latest jobs (3 free, the rest locked) */}
      <section className="bg-white py-16 sm:py-24">
        <div className="container-page flex flex-col gap-10">
          <SectionHead eyebrow="Latest jobs" title="Fresh opportunities this week" link={{ href: "/jobs", label: "View all jobs" }} />
          <GatedJobGrid jobs={jobs.slice(0, 6)} freeIds={getFreeJobIds(jobs)} />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24">
        <div className="container-page flex flex-col gap-10">
          <SectionHead eyebrow="How it works" title="Three steps to your next role" />
          <ol className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-white p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-600">Step {i + 1}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-[15px] text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PremiumTeaser />
    </>
  );
}
