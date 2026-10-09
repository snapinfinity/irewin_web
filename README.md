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
3. Run `npm run dodo:setup` — creates one EUR product per plan from `src/lib/data/plans.ts` and writes `DODO_PRODUCT_1M` … `_12M` into `.env.local` (re-running reuses existing products; changing a price creates a new one).
4. **Developer → Webhooks** → add `https://<your-site>/api/webhooks/dodo` with the `payment.succeeded` event → copy the signing secret (`whsec_…`) → `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Firebase Admin credentials: locally `FIREBASE_SERVICE_ACCOUNT_KEY_PATH=../irewin_dashboard/service-account.json`; on Vercel paste the JSON into `FIREBASE_SERVICE_ACCOUNT_JSON`.
6. Open `/api/status` — every Dodo/Admin entry should be `true`/`set`.
7. Pay with card `4242 4242 4242 4242`, expiry 06/32, CVC 123 (decline test: `4000 0000 0000 0002`).

To go live: create live keys, live products and a live webhook, set `DODO_PAYMENTS_ENVIRONMENT=live_mode` and `NEXT_PUBLIC_DODO_TEST_MODE=false`.

### One-time Firebase setup

1. Firebase Console → Authentication → Settings → **Authorized domains** → add your Vercel domain (e.g. `irewin-web-cwc6.vercel.app`) and any custom domain.
2. Deploy the updated rules from the dashboard folder: `npx firebase-tools deploy --only firestore:rules`.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/data/jobs.ts`, `categories.ts`, `companies.ts` | Firestore reads + helpers |
| `src/lib/firebase.ts` | Firebase setup (reads `.env.local`) |
| `src/lib/data/plans.ts` | The 4 Premium plans (1, 3, 6 months, 1 year). **Prices are placeholders.** |
| `src/lib/constants.ts` | `FREE_JOB_PREVIEW_COUNT` (3) and labels |
| `src/lib/auth/session-store.ts` | Google sign-in, `users` collection, starting checkout |
| `src/lib/server/dodo.ts` | Dodo client, plan → product ids, `applyPayment` (grants Premium) |
| `src/lib/server/firebase-admin.ts` | Firebase Admin + ID-token check for API routes |
| `src/app/api/checkout`, `src/app/api/webhooks/dodo` | Payment API routes |
| `src/lib/firebase-client.ts` | Browser Firebase (Auth + the user's own doc) |
| `src/components/GatedJobGrid.tsx` | Decides what's shown vs blurred |
| `public/images/hero-dublin.svg` | Hero illustration |

## Before going live

1. **Lock membership in Firestore rules:** users can still write their own `membership` from the browser. In `irewin_dashboard/firestore.rules` (users → update) add `&& request.resource.data.membership == resource.data.membership` for `isSelf()`, then deploy. (This also disables "Remove Premium (test)".)
2. **Real locking:** published jobs are publicly readable in Firestore today, so locked jobs are only hidden visually. Send full job details (description, apply link, etc.) only to logged-in Premium members, using server-side checks and Firestore security rules.
