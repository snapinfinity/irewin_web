"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";

/** Sends visitors who aren't logged in to /login, then back here afterwards. */
export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { ready, isLoggedIn } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !isLoggedIn) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, isLoggedIn, pathname, router]);

  if (!ready || !isLoggedIn) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto h-72 max-w-3xl animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }
  return <>{children}</>;
}
