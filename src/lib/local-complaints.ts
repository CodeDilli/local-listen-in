/** Local fallback store when Supabase is not configured.
 *  Complaints live in the browser only — fine for demo / offline use.
 */

export type LocalComplaint = {
  reference_code: string;
  title: string;
  category: string;
  description: string;
  location: string;
  ward: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintStatus = "submitted" | "in_progress" | "resolved" | "rejected";

const STORAGE_KEY = "tvk_local_complaints";
const ADMIN_SESSION_KEY = "tvk_admin_session";

/** Default admin password — change in production or set via env later */
export const ADMIN_PASSWORD = "admin123";

function readAll(): LocalComplaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: LocalComplaint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function generateReferenceCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `CMP-${hex}`;
}

export function saveLocalComplaint(
  data: Omit<LocalComplaint, "status" | "admin_notes" | "created_at" | "updated_at" | "reference_code"> & {
    reference_code?: string;
  }
): LocalComplaint {
  const now = new Date().toISOString();
  const row: LocalComplaint = {
    ...data,
    reference_code: (data.reference_code ?? generateReferenceCode()).toUpperCase(),
    status: "submitted",
    admin_notes: null,
    created_at: now,
    updated_at: now,
  };
  const all = readAll();
  all.unshift(row);
  writeAll(all.slice(0, 200));
  try {
    localStorage.setItem(
      "tvk_last_tracking_code",
      JSON.stringify({ code: row.reference_code, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
  return row;
}

export function findLocalComplaint(referenceCode: string): LocalComplaint | null {
  const code = referenceCode.trim().toUpperCase();
  return readAll().find((c) => c.reference_code === code) ?? null;
}

export function listLocalComplaints(): LocalComplaint[] {
  return readAll();
}

export function updateLocalComplaintStatus(
  referenceCode: string,
  status: ComplaintStatus,
  adminNotes?: string | null
): LocalComplaint | null {
  const code = referenceCode.trim().toUpperCase();
  const all = readAll();
  const idx = all.findIndex((c) => c.reference_code === code);
  if (idx < 0) return null;
  const updated: LocalComplaint = {
    ...all[idx],
    status,
    admin_notes: adminNotes !== undefined ? adminNotes : all[idx].admin_notes,
    updated_at: new Date().toISOString(),
  };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(loggedIn: boolean) {
  try {
    if (loggedIn) sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
  };
  return map[status] ?? status;
}
