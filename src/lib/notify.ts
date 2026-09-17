/**
 * Notifications for Vetri Sembakkam complaints.
 * Admin email: Google Apps Script MailApp → vetrisembakkam@gmail.com
 * (FormSubmit activation links often fail; GAS is reliable.)
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

/** Same Apps Script as complaints store — must include action "notify_admin" (see docs in repo). */
const GAS_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.["VITE_COMPLAINTS_API_URL"]) ||
  "https://script.google.com/macros/s/AKfycbxJDsGsXaOb_8R3Bb3wPvSStYV_EsB2v8Jgn07la_-wBzLB97BPrhUHt5G_Qbv0EHFaJg/exec";

function ntfyTopic(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_NTFY_TOPIC"]) ||
    "";
  const topic = String(fromEnv).trim().replace(/^\/+|\/+$/g, "");
  return topic || "vetri-sembakkam-complaints";
}

async function gasNotifyAdmin(payload: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "notify_admin", ...payload }),
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text) as { success?: boolean; ok?: boolean };
      return json.success === true || json.ok === true;
    } catch {
      // GAS may return empty on redirect — treat 2xx as ok attempt
      return res.ok;
    }
  } catch (e) {
    console.warn("[notify] gas email failed", e);
    return false;
  }
}

/** Backup: FormSubmit (only works after successful ACTIVATE FORM). */
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

  const problemTitle = complaint.title || "—";
  const problemDetail = complaint.description || "—";
  const area = [complaint.location, complaint.ward].filter(Boolean).join(" · ") || "—";
  const citizenName = complaint.contact_name?.trim() || "—";
  const mobile = complaint.contact_phone?.trim() || "—";
  const citizenEmail = complaint.contact_email?.trim() || "—";

  const message = [
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
    `${area}`,
    ``,
    `WHO FILED`,
    `Name: ${citizenName}`,
    `Mobile: ${mobile}`,
    `Email: ${citizenEmail}`,
    ``,
    `Open admin: ${SITE}/admin`,
    `Track link: ${trackUrl(code)}`,
  ].join("\n");

  await Promise.allSettled([
    gasNotifyAdmin({
      to: STAFF_EMAIL,
      subject,
      message,
      problem: `${problemTitle} — ${problemDetail}`,
      area,
      filed_by: citizenName,
      mobile,
      category: complaint.category,
      reference: code,
    }),
    formSubmit(STAFF_EMAIL, {
      _subject: subject,
      name: citizenName,
      email: citizenEmail !== "—" ? citizenEmail : STAFF_EMAIL,
      problem: `${problemTitle} — ${problemDetail}`,
      area,
      filed_by: citizenName,
      mobile,
      category: complaint.category,
      reference: code,
      message,
    }),
    ntfyPush(
      `New complaint ${code}`,
      `${problemTitle}\n${area}\n${citizenName} · ${mobile}\n${SITE}/admin`,
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
