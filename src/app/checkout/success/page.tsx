import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessView } from "@/components/CheckoutSuccessView";
import { RequireLogin } from "@/components/RequireLogin";

export const metadata: Metadata = { title: "Confirming payment" };

export default function CheckoutSuccessPage() {
  return (
    <RequireLogin>
      <Suspense fallback={null}>
        <CheckoutSuccessView />
      </Suspense>
    </RequireLogin>
  );
}
