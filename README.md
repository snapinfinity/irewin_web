# IREWIN – public job site

Next.js 16 (App Router) + Tailwind CSS v4. The public side of IREWIN: visitors browse categories and jobs, and Premium members unlock every listing. Jobs, categories and companies come **live from the same Firebase project as the admin dashboard** (https://irewin-dashboard.vercel.app/admin).

## Run it

```bash
cp .env.local.example .env.local   # then paste the NEXT_PUBLIC_FIREBASE_* values from irewin_dashboard/.env.local
npm install
npm run dev        # http://localhost:3000
```

On Vercel, add the same `NEXT_PUBLIC_FIREBASE_*` variables in Project → Settings → Environment Variables.

## Where the data comes from

| Site shows | Firestore query (read anonymously, allowed by the dashboard's rules) |
| --- | --- |
| Jobs | `jobs` where `status == "published"` and `isDeleted == false`, newest first |
| Categories + subcategories | `categories` where `isDeleted == false`, only `enabled` ones |
| Company name + logo | Stored on each job (`companyName`, `companyLogoURL`) by the dashboard |

Pages refresh every 60 seconds, so a job published in the dashboard appears on the site within about a minute.

To load test data into the dashboard, run `npm run seed:sample` in the **irewin_dashboard** folder (`npm run seed:sample -- --remove` deletes it again).

## Accounts and Premium

| Visitor | Sees |
| --- | --- |
| Not signed in | Categories, the 3 newest jobs (no apply button), and every other job as a blurred "Premium job" card |
| Signed in, no Premium | Same as above, plus the Premium plans page |
| Premium member | Every job, full details and the **Apply on company site** button |

- **Sign-in is Google only** (Firebase Auth, same project as the dashboard).
- On first sign-in the site creates `users/{uid}` with the full profile: uid, email, emailVerified, displayName, firstName, lastName, photoURL, phoneNumber, provider, locale, timeZone, marketingOptIn (+ date), membership, signupSource, createdAt, lastLoginAt, loginCount. If the account already exists, its saved details are kept and only the login info is refreshed.
- **Email promotions:** people are only added to the mailing list if they tick the opt-in box (unticked by default). They can change it any time on /account. Use `marketingOptIn == true` when exporting emails.
- **Premium is paid through Dodo Payments** (test mode for now — see below). "Remove Premium (test)" on /account clears it so you can buy again.

## Welcome email (Resend)

On a first Google sign-up the browser calls `POST /api/welcome`; the server ([email.ts](src/lib/server/email.ts)) sends one welcome email per account through Resend and records `welcomeEmailSentAt` on `users/{uid}`. Returning users get nothing. If Resend isn't configured or fails, sign-in still works.

Setup: resend.com → **Domains** → add `irewinjobs.com` and add the DNS records it shows at your domain provider → **API Keys** → create a key (Sending access) → `RESEND_API_KEY`. Set `EMAIL_FROM` (e.g. `IREWIN Jobs <welcome@irewinjobs.com>`) and optionally `EMAIL_REPLY_TO`. On Vercel: `node scripts/push-vercel-secrets.mjs` uploads the key; add `EMAIL_FROM`/`EMAIL_REPLY_TO` as normal variables.

## Payments (Dodo Payments)

1. /checkout → **Pay** calls `POST /api/checkout`, which checks the user's Firebase ID token and creates a Dodo hosted checkout with `metadata: { uid, planId }`.
2. The visitor pays on Dodo and returns to `/checkout/success?payment_id=…`.
3. Premium is granted **on the server only**, by whichever arrives first (the other is a no-op):
   - `POST /api/webhooks/dodo` — signed `payment.succeeded` webhook, and
   - `POST /api/checkout/confirm` — the return page asks the server to fetch the payment from Dodo and apply it (this is what makes local testing work without a public webhook URL).
4. Each payment is recorded in `payments/{paymentId}` and applied once; buying while Premium is active extends from the current expiry.

### Test mode setup

1. Dodo dashboard → switch **Live Mode off**.
2. **Developer → API Keys** → create a test key (Payments, Customers, Checkout Sessions: Write; Products: Write) → `DODO_PAYMENTS_API_KEY` in `.env.local`.
3. Run `npm run dodo:setup` — creates one EUR product per plan from `src/lib/data/plans.ts` and writes `DODO_PRODUCT_1W` and `DODO_PRODUCT_3M` into `.env.local` (re-running reuses existing products; changing a price creates a new one).
4. **Developer → Webhooks** → add `https://<your-site>/api/webhooks/dodo` with the `payment.succeeded` event → copy the signing secret (`whsec_…`) → `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Firebase Admin credentials: locally `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=../irewin_dashboard/service-account.json`; on Vercel paste the JSON into `FIREBASE_SERVICE_ACCOUNT_JSON`.
6. Open `/api/status` — every Dodo/Admin entry should be `true`/`set`.
7. Pay with card `4242 4242 4242 4242`, expiry 06/32, CVC 123 (decline test: `4000 0000 0000 0002`).

### Going live

Live keys go in `.env.live.local` (git-ignored, never read by the dev server), so local development stays in test mode.

1. Dodo → finish business verification, then switch **Live Mode on**.
2. **Developer → API Keys** → live key → `DODO_PAYMENTS_API_KEY` in `.env.live.local`.
3. **Developer → Webhooks** → `https://www.irewinjobs.com/api/webhooks/dodo`, event `payment.succeeded` → signing secret → `DODO_PAYMENTS_WEBHOOK_KEY`.
4. `npm run dodo:setup:live` creates the live products and writes their ids into `.env.live.local`.
5. `node scripts/push-vercel-secrets.mjs --live` switches Vercel Production to live (all six Dodo values at once), then redeploy.
6. The "Remove Premium (test)" button and the test-card notice disappear when `NEXT_PUBLIC_DODO_TEST_MODE=false`.

### One-time Firebase setup

1. Firebase Console → Authentication → Settings → **Authorized domains** → add your Vercel domain (e.g. `irewin-web-cwc6.vercel.app`) and any custom domain.
2. Deploy the updated rules from the dashboard folder: `npx firebase-tools deploy --only firestore:rules`.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/data/jobs.ts`, `categories.ts`, `companies.ts` | Firestore reads + helpers |
| `src/lib/firebase.ts` | Firebase setup (reads `.env.local`) |
| `src/lib/data/plans.ts` | The 2 Premium plans: Weekly €1.99 and 3 Months €19.99. |
| `src/lib/constants.ts` | `FREE_JOB_PREVIEW_COUNT` (3) and labels |
| `src/lib/auth/session-store.ts` | Google sign-in, `users` collection, starting checkout |
| `src/lib/server/dodo.ts` | Dodo client, plan → product ids, `applyPayment` (grants Premium) |
| `src/lib/server/firebase-admin.ts` | Firebase Admin + ID-token check for API routes |
| `src/app/api/checkout`, `src/app/api/webhooks/dodo` | Payment API routes |
| `src/lib/firebase-client.ts` | Browser Firebase (Auth + the user's own doc) |
| `src/components/GatedJobGrid.tsx` | Decides what's shown vs blurred |
| `public/images/hero-dublin.svg` | Hero illustration |

## Before going live

1. **Membership is locked in Firestore rules** (`irewin_dashboard/firestore.rules`, users): a signed-in user can't create their doc with a membership or change it afterwards; only the server (after a Dodo payment) and admins can. Deploy with `npx firebase-tools deploy --only firestore:rules` from the dashboard folder.
2. **Real locking:** published jobs are publicly readable in Firestore today, so locked jobs are only hidden visually. Send full job details (description, apply link, etc.) only to logged-in Premium members, using server-side checks and Firestore security rules.
