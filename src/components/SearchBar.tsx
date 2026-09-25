import { MapPin, Search } from "lucide-react";

/** Plain GET form → /jobs?q=…&location=… (works without JavaScript). */
export function SearchBar({
  locations,
  defaultQuery = "",
  defaultLocation = "",
}: {
  locations: string[];
  defaultQuery?: string;
  defaultLocation?: string;
}) {
  return (
    <form
      role="search"
      action="/jobs"
      className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_12px_32px_rgba(10,59,52,0.18)] md:flex-row md:items-center"
    >
      <label className="relative flex flex-[1.6] items-center">
        <span className="sr-only">Job title, skills or company</span>
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Job title, skills or company"
          className="h-12 w-full rounded-xl bg-transparent pl-12 pr-4 text-base text-ink placeholder:text-slate-400 focus:outline-none md:h-14"
        />
      </label>
      <div className="hidden h-8 w-px bg-line md:block" />
      <label className="relative flex flex-1 items-center border-t border-line md:border-t-0">
        <span className="sr-only">Location</span>
        <MapPin className="pointer-events-none absolute left-4 h-5 w-5 text-muted" />
        <select
          name="location"
          defaultValue={defaultLocation}
          className="h-12 w-full appearance-none rounded-xl bg-transparent pl-12 pr-4 text-base text-ink focus:outline-none md:h-14"
        >
          <option value="">All Ireland</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 font-display text-base font-semibold text-white hover:bg-brand-700 md:h-14"
      >
        <Search className="h-5 w-5" /> Search jobs
      </button>
    </form>
  );
}
