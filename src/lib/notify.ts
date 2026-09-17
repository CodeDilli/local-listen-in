/**
 * Notifications for Vetri Sembakkam complaints.
 * Admin gets email at vetrisembakkam@gmail.com via ntfy.sh Email header
 * (no FormSubmit / no Google Apps Script setup required).
 */

import type { Complaint, ComplaintStatus } from "@/lib/complaints";

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
  };
  return map[status] ?? status;
}

const STAFF_EMAIL = "vetrisembakkam@gmail.com";
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

/**
 * Push to ntfy + email to admin Gmail.
 * ntfy.sh supports Email header: delivers a real email to that address.
 * https://docs.ntfy.sh/publish/#e-mail-notifications
 */
async function ntfyNotifyAdmin(opts: {
  title: string;
  body: string;
  click?: string;
}): Promise<boolean> {
  const topic = ntfyTopic();
  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: opts.title,
        Priority: "high",
        Tags: "warning,clipboard",
        Email: STAFF_EMAIL,
        ...(opts.click ? { Click: opts.click } : {}),
      },
      body: opts.body,
    });
    if (!res.ok) {
      console.warn("[notify] ntfy", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notify] ntfy failed", e);
    return false;
  }
}

/** Optional citizen email via FormSubmit (best-effort; may need activation per address). */
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

function trackUrl(code: string): string {
  return `${SITE}/track?ref=${encodeURIComponent(code)}`;
}

/** Staff: email + push when a new complaint is filed */
export async function notifyAdminNewComplaint(complaint: Complaint): Promise<void> {
  const code = complaint.reference_code;

  const problemTitle = complaint.title || "—";
  const problemDetail = complaint.description || "—";
  const area = [complaint.location, complaint.ward].filter(Boolean).join(" · ") || "—";
  const citizenName = complaint.contact_name?.trim() || "—";
  const mobile = complaint.contact_phone?.trim() || "—";
  const citizenEmail = complaint.contact_email?.trim() || "—";

  const body = [
    `NEW COMPLAINT — Vetri Sembakkam`,
    ``,
    `Tracking code: ${code}`,
    ``,
    `PROBLEM`,
    `Title: ${problemTitle}`,
    `Details: ${problemDetail}`,
    `Category: ${complaint.category}`,
    ``,
    `AREA`,
    area,
    ``,
    `WHO FILED`,
    `Name: ${citizenName}`,
    `Mobile: ${mobile}`,
    `Email: ${citizenEmail}`,
    ``,
    `Admin: ${SITE}/admin`,
    `Track: ${trackUrl(code)}`,
  ].join("\n");

  await ntfyNotifyAdmin({
    title: `New complaint ${code} — ${problemTitle}`,
    body,
    click: `${SITE}/admin`,
  });
}

/** Citizen: confirmation after filing (best-effort) */
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

/** Citizen: status changed by staff (best-effort) */
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
