/**
 * Notify admin on WhatsApp when a citizen files a new complaint.
 * Uses free CallMeBot API (personal use): https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *
 * Setup (one time on admin phone):
 * 1. Save CallMeBot number in contacts (see callmebot.com for current number)
 * 2. WhatsApp them: I allow callmebot to send me messages
 * 3. Bot replies with your APIKEY
 * 4. On Vercel → Project → Settings → Environment Variables add:
 *    VITE_ADMIN_WHATSAPP = 917094412177
 *    VITE_CALLMEBOT_APIKEY = (the key from the bot)
 * 5. Redeploy
 */

import type { Complaint } from "@/lib/complaints";

function adminPhone(): string {
  const raw =
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_ADMIN_WHATSAPP"]) ||
    "917094412177";
  // digits only; ensure India country code if 10-digit local number
  let digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

function callMeBotApiKey(): string {
  return (
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> }).env?.["VITE_CALLMEBOT_APIKEY"]) ||
    ""
  ).trim();
}

function buildMessage(c: Complaint): string {
  const lines = [
    "*New complaint — Vetri Sembakkam*",
    "",
    `*Code:* ${c.reference_code}`,
    `*Title:* ${c.title}`,
    `*Category:* ${c.category}`,
    `*Location:* ${c.location}${c.ward ? ` (${c.ward})` : ""}`,
    `*Status:* Pending`,
    "",
    "Open staff panel:",
    "https://local-listen-in.vercel.app/admin",
  ];
  return lines.join("\n");
}

/**
 * Fire-and-forget WhatsApp notify. Never throws — filing a complaint must not fail if notify fails.
 */
export async function notifyAdminNewComplaint(complaint: Complaint): Promise<void> {
  const apikey = callMeBotApiKey();
  if (!apikey) {
    console.info(
      "[notify] WhatsApp skipped: set VITE_CALLMEBOT_APIKEY on Vercel (CallMeBot one-time setup)."
    );
    return;
  }

  const phone = adminPhone();
  const text = buildMessage(complaint);
  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}` +
    `&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });
    // CallMeBot returns HTML; treat network success as ok
    if (!res.ok) {
      console.warn("[notify] CallMeBot HTTP", res.status);
    }
  } catch (e) {
    // CORS or network — still try no-cors as best effort
    try {
      await fetch(url, { method: "GET", mode: "no-cors" });
    } catch (e2) {
      console.warn("[notify] WhatsApp send failed", e2 ?? e);
    }
  }
}
