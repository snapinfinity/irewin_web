import type { Review } from "@/lib/types";

/**
 * Made-up reviews for previewing the reviews design in local development
 * (`npm run dev`) only. They are never in Firestore and never shown on the
 * live site — getApprovedReviews() only adds them when NODE_ENV is "development".
 */
const day = (n: number) => new Date(Date.UTC(2026, 9, 20 - n, 10)).toISOString();

export const SAMPLE_REVIEWS: Review[] = [
  {
    uid: "sample-1",
    name: "Aoife M.",
    photoURL: null,
    rating: 5,
    text: "Found a marketing role in Galway within two weeks. Having every job in one place with the salary shown saved me so much time.",
    status: "approved",
    createdAt: day(1),
    updatedAt: day(1),
    sample: true,
  },
  {
    uid: "sample-2",
    name: "Liam O.",
    photoURL: null,
    rating: 4,
    text: "Clean, simple site. The weekly plan was perfect while I was job hunting. Would love more listings outside Dublin.",
    status: "approved",
    createdAt: day(3),
    updatedAt: day(3),
    sample: true,
  },
  {
    uid: "sample-3",
    name: "Priya S.",
    photoURL: null,
    rating: 5,
    text: "Moved to Ireland last year and didn't know where to start. The categories made it easy to see what's out there in healthcare.",
    status: "approved",
    createdAt: day(6),
    updatedAt: day(6),
    sample: true,
  },
  {
    uid: "sample-4",
    name: "Conor B.",
    photoURL: null,
    rating: 5,
    text: "Applied straight on the employer's site from the job page. No middleman, no spam. Got an interview the same week.",
    status: "approved",
    createdAt: day(9),
    updatedAt: day(9),
    sample: true,
  },
  {
    uid: "sample-5",
    name: "Sinéad K.",
    photoURL: null,
    rating: 4,
    text: "Good range of remote and hybrid jobs. Filtering by work mode is really handy.",
    status: "approved",
    createdAt: day(14),
    updatedAt: day(14),
    sample: true,
  },
  {
    uid: "sample-6",
    name: "Marek W.",
    photoURL: null,
    rating: 3,
    text: "Useful for construction jobs around Cork. A few listings had closed already, but most were current.",
    status: "approved",
    createdAt: day(20),
    updatedAt: day(20),
    sample: true,
  },
];
