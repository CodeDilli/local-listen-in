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

const STORAGE_KEY = "tvk_local_complaints";

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

export function saveLocalComplaint(
  data: Omit<LocalComplaint, "status" | "admin_notes" | "created_at" | "updated_at">
): LocalComplaint {
  const now = new Date().toISOString();
  const row: LocalComplaint = {
    ...data,
    status: "submitted",
    admin_notes: null,
    created_at: now,
    updated_at: now,
  };
  const all = readAll();
  all.unshift(row);
  writeAll(all.slice(0, 100));
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
