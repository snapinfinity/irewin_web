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

## How access works (test mode)

| Visitor | Sees |
| --- | --- |
| Not logged in | Categories, the 3 newest jobs (no apply button), and every other job as a blurred "Premium job" card |
| Logged in, no Premium | Same as above, plus the Premium plans page |
| Premium member | Every job, full details and the **Apply on company site** button |

Flow: **Log in / Create account → /premium (4 plans) → /checkout → Activate Premium (test) → /account**.

Login and Premium are **simulated in `localStorage`** so the whole flow can be tested without a backend:

- Any email + a password of 6+ characters signs you in.
- "Activate Premium (test)" on /checkout unlocks Premium straight away. No payment is taken.
- "Remove Premium (test)" on /account resets it.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/data/jobs.ts`, `categories.ts`, `companies.ts` | Firestore reads + helpers |
| `src/lib/firebase.ts` | Firebase setup (reads `.env.local`) |
| `src/lib/data/plans.ts` | The 4 Premium plans (1, 3, 6 months, 1 year). **Prices are placeholders.** |
| `src/lib/constants.ts` | `FREE_JOB_PREVIEW_COUNT` (3) and labels |
| `src/lib/auth/session-store.ts` | Test login + membership store. Swap for real auth and payments here |
| `src/components/GatedJobGrid.tsx` | Decides what's shown vs blurred |
| `public/images/hero-dublin.svg` | Hero illustration |

## Before going live

1. **Auth:** replace `signIn` / `signOut` in `session-store.ts` with real authentication (e.g. Firebase Auth).
2. **Payments:** in `CheckoutView.tsx`, start the payment provider's checkout and only set the membership after the provider confirms payment. Do this on the server (webhook), not in the browser.
3. **Real locking:** published jobs are publicly readable in Firestore today, so locked jobs are only hidden visually. Send full job details (description, apply link, etc.) only to logged-in Premium members, using server-side checks and Firestore security rules.
