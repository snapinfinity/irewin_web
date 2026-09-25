import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  link,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-brand-600">{eyebrow}</span>
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
        {subtitle && <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{subtitle}</p>}
      </div>
      {link && (
        <Link href={link.href} className="flex shrink-0 items-center gap-2 text-[15px] font-semibold text-brand-600 hover:text-brand-700">
          {link.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
