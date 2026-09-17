/**
 * Notifications for Vetri Sembakkam complaints.
 * Admin email → vetrisembakkam@gmail.com via Web3Forms.
 * Set VITE_WEB3FORMS_ACCESS_KEY on Vercel (free key from https://web3forms.com).
 */

import type { Complaint, ComplaintStatus } from "@/lib/complaints";

const STAFF_EMAIL = "vetrisembakkam@gmail.com";
const SITE = "https://local-listen-in.vercel.app";

function web3formsKey(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_WEB3FORMS_ACCESS_KEY"]) ||
    "";
  return String(fromEnv).trim();
}

function ntfyTopic(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_NTFY_TOPIC"]) ||
    "";
  const topic = String(fromEnv).trim().replace(/^\/+|\/+$/g, "");
  return topic || "vetri-sembakkam-complaints";
}

async function web3formsSend(fields: Record<string, string>): Promise<boolean> {
  const access_key = web3formsKey();
  if (!access_key) {
    console.warn("[notify] VITE_WEB3FORMS_ACCESS_KEY not set — skip email");
    return false;
  }
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key,
        from_name: "Vetri Sembakkam Portal",
        ...fields,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    if (!res.ok || data.success === false) {
      console.warn("[notify] web3forms", res.status, data);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notify] web3forms failed", e);
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
        Tags: "warning,clipboard",
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

/** Staff: email + app push when a new complaint is filed */
export async function notifyAdminNewComplaint(complaint: Complaint): Promise<void> {
  const code = complaint.reference_code;

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

  await Promise.allSettled([
    web3formsSend({
      subject: `New complaint ${code} — ${problemTitle}`,
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

export async function notifyCitizenFiled(_complaint: Complaint): Promise<void> {
  // Admin email is the priority; citizen mail needs a separate mail provider.
}

export async function notifyCitizenStatus(
  _complaint: Complaint,
  _status: ComplaintStatus
): Promise<void> {
  // Admin email is the priority.
}

export async function notifyComplaintFiled(complaint: Complaint): Promise<void> {
  await Promise.allSettled([
    notifyAdminNewComplaint(complaint),
    notifyCitizenFiled(complaint),
  ]);
}
