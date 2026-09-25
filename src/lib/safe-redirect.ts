/** Only allow same-site relative paths as post-login redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/jobs"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
