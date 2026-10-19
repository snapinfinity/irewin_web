import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve Firebase's Google sign-in helper from our own domain, so Google's
  // account chooser says "continue to irewinjobs.com" instead of
  // "<project>.firebaseapp.com". Takes effect when NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  // is set to the site's domain (www.irewinjobs.com).
  async rewrites() {
    const firebaseHost = `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;
    return [
      { source: "/__/auth/:path*", destination: `${firebaseHost}/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `${firebaseHost}/__/firebase/:path*` },
    ];
  },
};

export default nextConfig;
