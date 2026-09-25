import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/components/CheckoutView";
import { RequireLogin } from "@/components/RequireLogin";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <RequireLogin>
      <Suspense fallback={null}>
        <CheckoutView />
      </Suspense>
    </RequireLogin>
  );
}
