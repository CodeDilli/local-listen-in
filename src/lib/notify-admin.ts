/**
 * Notify admin via ntfy app push when a citizen files a new complaint.
 * Free service: https://ntfy.sh
 *
 * Setup (one time):
 * 1. Install "ntfy" app (Android / iPhone) or open https://ntfy.sh/app
 * 2. Subscribe to your private topic (same as VITE_NTFY_TOPIC)
 * 3. On Vercel → Settings → Environment Variables:
 *      VITE_NTFY_TOPIC = vetri-sembakkam-alerts-YOURSECRET
 *    (pick a hard-to-guess name so only you get the alerts)
 * 4. Redeploy, then file a test complaint
 */

import type { Complaint } from "@/lib/complaints";

function ntfyTopic(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_NTFY_TOPIC"]) ||
    "";
  const topic = String(fromEnv).trim().replace(/^\/+|\/+$/g, "");
  // Default topic — change on Vercel for privacy
  return topic || "vetri-sembakkam-complaints";
}

function buildTitle(c: Complaint): string {
  return `New complaint ${c.reference_code}`;
}

function buildBody(c: Complaint): string {
  const lines = [
    c.title,
    `Category: ${c.category}`,
    `Location: ${c.location}${c.ward ? ` (${c.ward})` : ""}`,
    "Status: Pending",
    "",
    "Open admin: https://local-listen-in.vercel.app/admin",
  ];
  return lines.join("\n");
}

/**
 * Fire-and-forget phone push via ntfy.sh. Never throws.
 */
export async function notifyAdminNewComplaint(complaint: Complaint): Promise<void> {
  const topic = ntfyTopic();
  const url = `https://ntfy.sh/${encodeURIComponent(topic)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Title: buildTitle(complaint),
        Priority: "high",
        Tags: "warning,clipboard",
        Click: "https://local-listen-in.vercel.app/admin",
      },
      body: buildBody(complaint),
    });
    if (!res.ok) {
      console.warn("[notify] ntfy HTTP", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.warn("[notify] ntfy send failed", e);
  }
}
