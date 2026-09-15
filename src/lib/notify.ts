/**
 * Notifications for Vetri Sembakkam complaints.
 * - Email staff when a complaint is filed
 * - Email citizen confirmation + status updates
 * - Optional phone push via ntfy.sh
 */

import type { Complaint, ComplaintStatus } from "@/lib/complaints";
import { statusLabel } from "@/lib/complaints";

const STAFF_EMAIL = "g.dilliganesh99@gmail.com";
const SITE = "https://local-listen-in.vercel.app";
const HELPLINE = "7094412177";

function ntfyTopic(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_NTFY_TOPIC"]) ||
    "";
  const topic = String(fromEnv).trim().replace(/^\/+|\/+$/g, "");
  return topic || "vetri-sembakkam-complaints";
}

/** FormSubmit AJAX — works without a backend. First use may need inbox confirmation. */
async function formSubmit(
  to: string,
  payload: Record<string, string>
): Promise<boolean> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ...payload,
        _template: "table",
        _captcha: "false",
      }),
    });
    if (!res.ok) {
      console.warn("[notify] formsubmit", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notify] formsubmit failed", e);
    return false;
  }
}

async function ntfyPush(title: string, body: string, click?: string): Promise<void> {
  const topic = ntfyTopic();
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: title,
        Priority: "high",
        Tags: "loudspeaker,clipboard",
        ...(click ? { Click: click } : {}),
      },
      body,
    });
  } catch (e) {
    console.warn("[notify] ntfy failed", e);
  }
}

function trackUrl(code: string): string {
  return `${SITE}/track?ref=${encodeURIComponent(code)}`;
}

/** Staff: new complaint email + phone push */
export async function notifyAdminNewComplaint(complaint: Complaint): Promise<void> {
  const code = complaint.reference_code;
  const subject = `New complaint ${code} — ${complaint.title}`;
  const message = [
    `A citizen filed a new complaint on Vetri Sembakkam.`,
    ``,
    `Reference: ${code}`,
    `Title: ${complaint.title}`,
    `Category: ${complaint.category}`,
    `Location: ${complaint.location}${complaint.ward ? ` (${complaint.ward})` : ""}`,
    `Description: ${complaint.description}`,
    ``,
    `Citizen: ${complaint.contact_name || "—"}`,
    `Email: ${complaint.contact_email || "—"}`,
    `Phone: ${complaint.contact_phone || "—"}`,
    ``,
    `Admin panel: ${SITE}/admin`,
    `Track: ${trackUrl(code)}`,
  ].join("\n");

  await Promise.allSettled([
    formSubmit(STAFF_EMAIL, {
      _subject: subject,
      name: complaint.contact_name || "Citizen",
      email: complaint.contact_email || STAFF_EMAIL,
      message,
      reference: code,
      category: complaint.category,
      location: complaint.location,
    }),
    ntfyPush(
      `New complaint ${code}`,
      `${complaint.title}\n${complaint.category} · ${complaint.location}\n${SITE}/admin`,
      `${SITE}/admin`
    ),
  ]);
}

/** Citizen: confirmation after filing */
export async function notifyCitizenFiled(complaint: Complaint): Promise<void> {
  const email = (complaint.contact_email || "").trim();
  if (!email || !email.includes("@") || email.endsWith(".invalid")) return;

  const code = complaint.reference_code;
  const message = [
    `Vanakkam ${complaint.contact_name || ""},`,
    ``,
    `Your complaint was received by Vetri Sembakkam.`,
    ``,
    `Tracking code: ${code}`,
    `Issue: ${complaint.title}`,
    `Category: ${complaint.category}`,
    `Location: ${complaint.location}`,
    `Status: Pending`,
    ``,
    `Track anytime: ${trackUrl(code)}`,
    ``,
    `Helpline: ${HELPLINE}`,
    `Email: ${STAFF_EMAIL}`,
    `Hours: Mon–Fri, 10:00–18:00`,
    ``,
    `— Vetri Sembakkam Civic Portal`,
  ].join("\n");

  await formSubmit(email, {
    _subject: `Complaint received — ${code}`,
    name: "Vetri Sembakkam",
    email: STAFF_EMAIL,
    message,
    reference: code,
  });
}

/** Citizen: status changed by staff */
export async function notifyCitizenStatus(
  complaint: Complaint,
  status: ComplaintStatus
): Promise<void> {
  const email = (complaint.contact_email || "").trim();
  if (!email || !email.includes("@") || email.endsWith(".invalid")) return;

  const code = complaint.reference_code;
  const label = statusLabel(status);
  const message = [
    `Vanakkam ${complaint.contact_name || ""},`,
    ``,
    `Update on your complaint ${code}.`,
    ``,
    `Issue: ${complaint.title}`,
    `New status: ${label}`,
    complaint.admin_notes ? `Staff note: ${complaint.admin_notes}` : "",
    ``,
    `Track details: ${trackUrl(code)}`,
    ``,
    `Helpline: ${HELPLINE}`,
    ``,
    `— Vetri Sembakkam Civic Portal`,
  ]
    .filter(Boolean)
    .join("\n");

  await formSubmit(email, {
    _subject: `Complaint ${code} — ${label}`,
    name: "Vetri Sembakkam",
    email: STAFF_EMAIL,
    message,
    reference: code,
    status: label,
  });
}

/** Called after a successful file — staff + citizen */
export async function notifyComplaintFiled(complaint: Complaint): Promise<void> {
  await Promise.allSettled([
    notifyAdminNewComplaint(complaint),
    notifyCitizenFiled(complaint),
  ]);
}
