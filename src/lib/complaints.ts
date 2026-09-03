/**
 * Shared complaint store — Supabase first (all users see the same data).
 * Falls back to browser storage only when Supabase env is not set.
 */

import { getSupabaseConfigStatus } from "@/integrations/supabase/client";

export type Complaint = {
  reference_code: string;
  title: string;
  category: string;
  description: string;
  location: string;
  ward: string | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintStatus = "submitted" | "in_progress" | "resolved" | "rejected";

export type NewComplaint = {
  title: string;
  category: string;
  description: string;
  location: string;
  ward?: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
};

const STORAGE_KEY = "tvk_local_complaints";
const ADMIN_SESSION_KEY = "tvk_admin_session";

export const ADMIN_PASSWORD = "admin123";

export function isCloudConfigured(): boolean {
  return getSupabaseConfigStatus().ok;
}

export function generateReferenceCode(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `CMP-${hex}`;
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

function readLocal(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items: Complaint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
}

export async function createComplaint(data: NewComplaint): Promise<Complaint> {
  const code = generateReferenceCode();
  const now = new Date().toISOString();

  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const row = {
        reference_code: code,
        title: data.title,
        category: data.category,
        description: data.description,
        location: data.location,
        ward: data.ward || null,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        status: "submitted",
        admin_notes: null,
      };
      const { data: inserted, error } = await supabase
        .from("complaints")
        .insert(row)
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .single();
      if (!error && inserted) {
        return inserted as Complaint;
      }
      console.warn("[complaints] cloud insert failed, using local", error);
    } catch (e) {
      console.warn("[complaints] cloud unavailable", e);
    }
  }

  const local: Complaint = {
    ...data,
    reference_code: code,
    ward: data.ward || null,
    contact_phone: data.contact_phone || null,
    status: "submitted",
    admin_notes: null,
    created_at: now,
    updated_at: now,
  };
  const all = readLocal();
  all.unshift(local);
  writeLocal(all);
  return local;
}

export async function findComplaint(referenceCode: string): Promise<Complaint | null> {
  const code = referenceCode.trim().toUpperCase();

  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("complaints_public")
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .eq("reference_code", code)
        .maybeSingle();
      if (!error && data) return data as Complaint;

      const { data: row } = await supabase
        .from("complaints")
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .eq("reference_code", code)
        .maybeSingle();
      if (row) return row as Complaint;
    } catch {
      /* fall through */
    }
  }

  return readLocal().find((c) => c.reference_code === code) ?? null;
}

export async function listComplaints(): Promise<Complaint[]> {
  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("complaints_public")
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) return data as Complaint[];

      const { data: rows } = await supabase
        .from("complaints")
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (rows) return rows as Complaint[];
    } catch {
      /* fall through */
    }
  }

  return readLocal();
}

export async function listComplaintsForStaff(): Promise<Complaint[]> {
  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("complaints")
        .select(
          "reference_code, title, category, description, location, ward, contact_name, contact_email, contact_phone, status, admin_notes, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) return data as Complaint[];
      return listComplaints();
    } catch {
      return listComplaints();
    }
  }
  return readLocal();
}

export async function updateComplaintStatus(
  referenceCode: string,
  status: ComplaintStatus,
  adminNotes?: string | null
): Promise<Complaint | null> {
  const code = referenceCode.trim().toUpperCase();
  const now = new Date().toISOString();

  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const patch: Record<string, unknown> = {
        status,
        updated_at: now,
      };
      if (adminNotes !== undefined) patch.admin_notes = adminNotes;

      const { data, error } = await supabase
        .from("complaints")
        .update(patch)
        .eq("reference_code", code)
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .maybeSingle();
      if (!error && data) return data as Complaint;
      console.warn("[complaints] cloud update failed", error);
    } catch (e) {
      console.warn("[complaints] cloud update error", e);
    }
  }

  const all = readLocal();
  const idx = all.findIndex((c) => c.reference_code === code);
  if (idx < 0) return null;
  const updated: Complaint = {
    ...all[idx],
    status,
    admin_notes: adminNotes !== undefined ? adminNotes : all[idx].admin_notes,
    updated_at: now,
  };
  all[idx] = updated;
  writeLocal(all);
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
