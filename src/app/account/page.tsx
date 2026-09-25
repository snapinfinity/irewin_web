import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/components/AccountView";
import { RequireLogin } from "@/components/RequireLogin";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <RequireLogin>
      <Suspense fallback={null}>
        <AccountView />
      </Suspense>
    </RequireLogin>
  );
}
