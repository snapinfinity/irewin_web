import { clsx } from "clsx";

export function Badge({
  children,
  tone = "green",
  className,
}: {
  children: React.ReactNode;
  tone?: "green" | "gray" | "dark" | "gold";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium",
        tone === "green" && "bg-brand-50 text-brand-600",
        tone === "gray" && "bg-slate-100 text-ink-2",
        tone === "dark" && "border border-white/20 bg-white/10 text-white",
        tone === "gold" && "bg-gold-soft text-amber-800",
        className,
      )}
    >
      {children}
    </span>
  );
}
