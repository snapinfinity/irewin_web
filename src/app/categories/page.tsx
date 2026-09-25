import type { Metadata } from "next";
import { CategoryCardFull } from "@/components/CategoryCard";
import { getCategories } from "@/lib/data/categories";
import { countByCategory, countBySubcategory, getPublishedJobs } from "@/lib/data/jobs";

export const metadata: Metadata = { title: "Job categories" };

export const revalidate = 60;

export default async function CategoriesPage() {
  const [categories, jobs] = await Promise.all([getCategories(), getPublishedJobs()]);
  const counts = countByCategory(jobs);
  const subCounts = countBySubcategory(jobs);
  return (
    <>
      <section className="bg-dark">
        <div className="container-page py-10 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Browse jobs by category</h1>
          <p className="mt-3 max-w-2xl text-on-dark sm:text-lg">
            {categories.length} categories and their specialist areas, updated as new roles are published.
          </p>
        </div>
      </section>
      <section className="container-page py-10 sm:py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <CategoryCardFull key={c.id} category={c} count={counts[c.slug] ?? 0} subCounts={subCounts} />
          ))}
        </div>
      </section>
    </>
  );
}
