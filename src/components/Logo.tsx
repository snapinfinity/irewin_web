import Link from "next/link";
import { clsx } from "clsx";

const HEART =
  "M0 0 C -14 -10 -22 -18 -22 -28 C -22 -36 -16 -41 -10 -41 C -5 -41 -1 -38 0 -34 C 1 -38 5 -41 10 -41 C 16 -41 22 -36 22 -28 C 22 -18 14 -10 0 0 Z";

export function Shamrock({ className }: { className?: string }) {
  return (
    <svg viewBox="-46 -46 92 96" aria-hidden="true" className={className}>
      {[0, 120, 240].map((a) => (
        <path key={a} d={HEART} transform={`rotate(${a})`} fill="currentColor" />
      ))}
      <path d="M0 2 C 2 20 8 34 18 46" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = true, className }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="IREWIN home" className={clsx("flex items-center gap-2", className)}>
      <Shamrock className="h-8 w-8 text-accent" />
      <span className={clsx("font-display text-2xl font-extrabold tracking-wide", dark ? "text-white" : "text-dark")}>
        IRE<span className={dark ? "text-accent" : "text-green-600"}>WIN</span>
      </span>
    </Link>
  );
}
