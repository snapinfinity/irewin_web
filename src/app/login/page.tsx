import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex justify-center bg-[radial-gradient(circle_at_top,#e6f6ef,transparent_60%)] px-4 py-12 sm:py-20">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-white" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
