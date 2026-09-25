import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCategories } from "@/lib/data/categories";
import { getLocations, getPublishedJobs } from "@/lib/data/jobs";

export async function Footer() {
  const [categories, jobs] = await Promise.all([getCategories(), getPublishedJobs()]);
  const locations = getLocations(jobs).slice(0, 6).map((l) => l.name);
  const cols = [
    { title: "Jobs by category", links: categories.slice(0, 6).map((c) => ({ label: c.name, href: `/jobs?category=${c.slug}` })) },
    { title: "Jobs by location", links: locations.map((l) => ({ label: l, href: `/jobs?location=${encodeURIComponent(l)}` })) },
    {
      title: "IREWIN",
      links: [
        { label: "Premium plans", href: "/premium" },
        { label: "All categories", href: "/categories" },
        { label: "My account", href: "/account" },
        { label: "Privacy policy", href: "#" },
        { label: "Terms of use", href: "#" },
      ],
    },
  ];
  return (
    <footer className="bg-dark text-on-dark">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-16">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-[15px] leading-relaxed">
            Connecting talented people with great opportunities across Ireland. Better Jobs. A Brighter Future.
          </p>
        </div>
        {cols.filter((c) => c.links.length > 0).map((c) => (
          <div key={c.title} className="flex flex-col gap-4">
            <h2 className="text-[15px] font-semibold text-white">{c.title}</h2>
            <ul className="flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[15px] hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-white/10 py-6 text-sm sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} IREWIN. All rights reserved.</span>
        <span>Every listing is reviewed by our team before it goes live.</span>
      </div>
    </footer>
  );
}
