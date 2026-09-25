import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/Badge";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/lib/types";

/** Compact card for the home page: whole card links to the category's jobs. */
export function CategoryCard({ category, count }: { category: Category; count: number }) {
  return (
    <Link
      href={`/jobs?category=${category.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CategoryIcon icon={category.icon} className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-brand-600">
          {count} job{count === 1 ? "" : "s"}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-ink group-hover:text-brand-600">{category.name}</h3>
      <div className="flex flex-wrap gap-1.5">
        {category.subcategories.slice(0, 3).map((s) => (
          <Badge key={s.slug} tone="gray" className="h-6 border border-line bg-white px-2.5 text-xs">
            {s.name}
          </Badge>
        ))}
      </div>
    </Link>
  );
}

/** Full card for /categories: title and every subcategory are separate links (no nested links). */
export function CategoryCardFull({
  category,
  count,
  subCounts,
}: {
  category: Category;
  count: number;
  /** keyed "category/subcategory" */
  subCounts: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-brand-600 hover:shadow-card sm:p-6">
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CategoryIcon icon={category.icon} className="h-6 w-6" />
        </span>
        <span className="text-sm font-semibold text-brand-600">
          {count} job{count === 1 ? "" : "s"}
        </span>
      </div>
      <h2 className="text-lg font-bold">
        <Link href={`/jobs?category=${category.slug}`} className="text-ink hover:text-brand-600">
          {category.name}
        </Link>
      </h2>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Subcategories</p>
        <ul className="mt-2 border-t border-line pt-1">
          {category.subcategories.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/jobs?category=${category.slug}&subcategory=${s.slug}`}
                className="flex min-h-10 items-center justify-between gap-2 text-[15px] text-ink-2 hover:text-brand-600"
              >
                <span>{s.name}</span>
                <span className="flex items-center gap-1 text-[13px] text-muted">
                  {subCounts[`${category.slug}/${s.slug}`] ?? 0}
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={`/jobs?category=${category.slug}`}
        className="mt-auto flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        View all jobs <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
