"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";
import { Crown, LogOut, Menu, User, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/auth/useSession";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/categories", label: "Categories" },
  { href: "/premium", label: "Premium" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user, isPremium, signOut } = useSession();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // The mobile menu closes itself whenever the route changes.
  const open = openPath === pathname;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  function handleSignOut() {
    signOut();
    setOpenPath(null);
    router.push("/");
  }

  const authArea = !ready ? (
    <div className="h-10 w-40" aria-hidden="true" />
  ) : user ? (
    <div className="flex items-center gap-3">
      {isPremium ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-amber-800">
          <Crown className="h-4 w-4" /> Premium
        </span>
      ) : (
        <Link
          href="/premium"
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-semibold text-dark hover:bg-accent-soft"
        >
          <Crown className="h-4 w-4" /> Go Premium
        </Link>
      )}
      <Link
        href="/account"
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-white hover:bg-white/10"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 font-display font-bold">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden xl:inline">{user.name.split(" ")[0]}</span>
      </Link>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
        Log in
      </Link>
      <Link
        href="/login?mode=register&next=/premium"
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 font-display text-sm font-semibold text-dark hover:bg-accent-soft"
      >
        <Crown className="h-4 w-4" /> Get Premium
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-dark/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "border-b-2 py-2 text-[15px] font-medium transition-colors",
                isActive(n.href) ? "border-accent text-accent" : "border-transparent text-on-dark hover:text-white",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">{authArea}</div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white hover:bg-white/10 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-dark lg:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col py-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "rounded-lg px-3 py-3 text-base font-medium",
                  isActive(n.href) ? "bg-white/10 text-accent" : "text-white hover:bg-white/5",
                )}
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-white/10 pt-4">
              {ready && user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/account" className="flex items-center gap-2 rounded-lg px-3 py-3 text-white hover:bg-white/5">
                    <User className="h-5 w-5" /> My account
                    {isPremium && (
                      <span className="ml-auto rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-amber-800">Premium</span>
                    )}
                  </Link>
                  {!isPremium && (
                    <Link href="/premium" className="rounded-xl bg-accent px-4 py-3 text-center font-display font-semibold text-dark">
                      Go Premium
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-on-dark hover:bg-white/5"
                  >
                    <LogOut className="h-5 w-5" /> Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="rounded-xl border border-white/30 px-4 py-3 text-center font-semibold text-white">
                    Log in
                  </Link>
                  <Link
                    href="/login?mode=register&next=/premium"
                    className="rounded-xl bg-accent px-4 py-3 text-center font-display font-semibold text-dark"
                  >
                    Get Premium
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
