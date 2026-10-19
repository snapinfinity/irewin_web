import { Resend } from "resend";
import { FREE_JOB_PREVIEW_COUNT } from "@/lib/constants";

/**
 * Transactional email through Resend (server only). EMAIL_FROM must use a
 * domain verified in Resend (e.g. "IREWIN Jobs <welcome@irewinjobs.com>").
 * Until the domain is verified, Resend only delivers from
 * onboarding@resend.dev to the Resend account's own address.
 */
let client: Resend | undefined;

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

function resend(): Resend {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends the one-time welcome email. `uid` doubles as Resend's idempotency key, so a retry never sends twice. */
export async function sendWelcomeEmail({ uid, to, firstName, siteUrl }: { uid: string; to: string; firstName: string; siteUrl: string }) {
  const name = firstName.trim() || "there";
  const { data, error } = await resend().emails.send(
    {
      from: process.env.EMAIL_FROM!,
      to,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      subject: `Welcome to IREWIN, ${name}!`,
      html: welcomeHtml(escape(name), siteUrl),
      text: welcomeText(name, siteUrl),
      tags: [{ name: "type", value: "welcome" }],
    },
    { idempotencyKey: `welcome-${uid}` },
  );
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
  return data!.id;
}

function welcomeText(name: string, site: string) {
  return `Hi ${name},

Welcome to IREWIN, jobs across Ireland in one place.

Your free account lets you browse every category and see the ${FREE_JOB_PREVIEW_COUNT} newest jobs.
Browse jobs: ${site}/jobs

Want every listing? Premium unlocks all jobs, full details and direct apply links.
See Premium plans: ${site}/premium

Manage your account and email preferences: ${site}/account

Good luck with the search!
The IREWIN team`;
}

// Table layout + inline styles: what email clients (Gmail, Outlook) render reliably.
function welcomeHtml(name: string, site: string) {
  const button = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:10px">${label}</a>`;
  const benefit = (text: string) =>
    `<tr><td style="padding:5px 0;font-size:15px;color:#374151"><span style="color:#22c55e;font-weight:700">&#10003;</span>&nbsp; ${text}</td></tr>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to IREWIN</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
  <tr><td style="background:#0a3b34;padding:22px 28px">
    <a href="${site}" style="text-decoration:none;font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff">&#9752; IRE<span style="color:#22c55e">WIN</span></a>
  </td></tr>
  <tr><td style="padding:30px 28px 8px">
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#1f2937">Welcome, ${name}! &#128075;</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#374151">Thanks for joining IREWIN, your place to find jobs across Ireland. Your free account is ready.</p>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#374151">Start by browsing categories and the ${FREE_JOB_PREVIEW_COUNT} newest jobs:</p>
    ${button(`${site}/jobs`, "Browse jobs", "#0f766e", "#ffffff")}
  </td></tr>
  <tr><td style="padding:26px 28px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e6f6ef;border-radius:12px">
      <tr><td style="padding:20px 22px">
        <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0a3b34">&#128081; Want every job?</p>
        <table role="presentation" cellpadding="0" cellspacing="0">
          ${benefit("See every job listed across Ireland")}
          ${benefit("Apply directly on employers' websites")}
          ${benefit("Full salary, requirements and benefits")}
        </table>
        <div style="margin-top:16px">${button(`${site}/premium`, "See Premium plans", "#22c55e", "#0a3b34")}</div>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 28px 30px;font-size:15px;line-height:1.6;color:#374151">Good luck with the search!<br><strong>The IREWIN team</strong></td></tr>
  <tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#6b7280">
    You're receiving this because you created an IREWIN account with this email address.
    Manage your account and email preferences at <a href="${site}/account" style="color:#0f766e">${site.replace(/^https?:\/\//, "")}/account</a>.
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
