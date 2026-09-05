/**
 * Shared complaint store.
 * 1) Supabase when VITE_SUPABASE_* is set on Vercel (recommended)
 * 2) Google Apps Script shared API
 * 3) Browser localStorage last resort (same phone only)
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

const GAS_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.["VITE_COMPLAINTS_API_URL"]) ||
  "https://script.google.com/macros/s/AKfycbxJDsGsXaOb_8R3Bb3wPvSStYV_EsB2v8Jgn07la_-wBzLB97BPrhUHt5G_Qbv0EHFaJg/exec";

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    /* quota */
  }
}

function upsertLocal(row: Complaint) {
  const all = readLocal().filter((c) => c.reference_code !== row.reference_code);
  all.unshift(row);
  writeLocal(all);
}

function mergeByCode(...lists: Complaint[][]): Complaint[] {
  const map = new Map<string, Complaint>();
  for (const list of lists) {
    for (const c of list) {
      if (!c?.reference_code) continue;
      const prev = map.get(c.reference_code);
      if (!prev || String(c.updated_at) > String(prev.updated_at)) {
        map.set(c.reference_code, c);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at))
  );
}

async function gasRequest(body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function gasList(): Promise<Complaint[]> {
  try {
    const result = (await gasRequest({ action: "list" })) as {
      complaints?: Complaint[];
      data?: Complaint[];
    } | null;
    if (!result) return [];
    const rows = result.complaints ?? result.data ?? [];
    return Array.isArray(rows) ? (rows as Complaint[]) : [];
  } catch {
    return [];
  }
}

async function gasGet(code: string): Promise<Complaint | null> {
  try {
    const result = (await gasRequest({ action: "get", reference_code: code })) as {
      complaint?: Complaint;
      data?: Complaint;
    } | null;
    if (!result) return null;
    return (result.complaint ?? result.data ?? null) as Complaint | null;
  } catch {
    return null;
  }
}

async function gasCreate(row: Complaint): Promise<Complaint | null> {
  try {
    const result = (await gasRequest({ action: "create", ...row })) as {
      success?: boolean;
      reference_code?: string;
      complaint?: Complaint;
    } | null;
    if (result?.complaint) return result.complaint as Complaint;
    if (result?.reference_code) {
      return { ...row, reference_code: String(result.reference_code).toUpperCase() };
    }
    if (result && result.success !== false) return row;
    return null;
  } catch {
    return null;
  }
}

async function gasUpdate(
  code: string,
  status: ComplaintStatus,
  adminNotes?: string | null
): Promise<Complaint | null> {
  try {
    const result = (await gasRequest({
      action: "update",
      reference_code: code,
      status,
      admin_notes: adminNotes ?? null,
    })) as { success?: boolean; complaint?: Complaint } | null;
    if (result?.complaint) return result.complaint as Complaint;
    if (result?.success) return await gasGet(code);
    return null;
  } catch {
    return null;
  }
}

export async function createComplaint(data: NewComplaint): Promise<Complaint> {
  const code = generateReferenceCode();
  const now = new Date().toISOString();
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
          "reference_code, title, category, description, location, ward, contact_name, contact_email, contact_phone, status, admin_notes, created_at, updated_at"
        )
        .single();
      if (!error && inserted) {
        upsertLocal(inserted as Complaint);
        return inserted as Complaint;
      }
    } catch (e) {
      console.warn("[complaints] supabase insert failed", e);
    }
  }

  const fromGas = await gasCreate(local);
  if (fromGas) {
    upsertLocal(fromGas);
    return fromGas;
  }

  upsertLocal(local);
  return local;
}

export async function findComplaint(referenceCode: string): Promise<Complaint | null> {
  const code = referenceCode.trim().toUpperCase();

  if (isCloudConfigured()) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("complaints_public")
        .select(
          "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
        )
        .eq("reference_code", code)
        .maybeSingle();
      if (data) return data as Complaint;
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

  const fromGas = await gasGet(code);
  if (fromGas) {
    upsertLocal(fromGas);
    return fromGas;
  }

  return readLocal().find((c) => c.reference_code === code) ?? null;
}

export async function listComplaints(): Promise<Complaint[]> {
  let cloud: Complaint[] = [];
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
      if (!error && data) cloud = data as Complaint[];
      else {
        const { data: rows } = await supabase
          .from("complaints")
          .select(
            "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
          )
          .order("created_at", { ascending: false })
          .limit(100);
        if (rows) cloud = rows as Complaint[];
      }
    } catch {
      /* fall through */
    }
  }
  const gas = await gasList();
  return mergeByCode(cloud, gas, readLocal());
}

export async function listComplaintsForStaff(): Promise<Complaint[]> {
  let cloud: Complaint[] = [];
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
      if (!error && data) cloud = data as Complaint[];
    } catch {
      /* fall through */
    }
  }
  const gas = await gasList();
  return mergeByCode(cloud, gas, readLocal());
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
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (adminNotes !== undefined) patch.admin_notes = adminNotes;
      const { data, error } = await supabase
        .from("complaints")
        .update(patch)
        .eq("reference_code", code)
        .select(
          "reference_code, title, category, description, location, ward, contact_name, contact_email, contact_phone, status, admin_notes, created_at, updated_at"
        )
        .maybeSingle();
      if (!error && data) {
        upsertLocal(data as Complaint);
        return data as Complaint;
      }
    } catch (e) {
      console.warn("[complaints] supabase update error", e);
    }
  }

  const fromGas = await gasUpdate(code, status, adminNotes);
  if (fromGas) {
    upsertLocal(fromGas);
    return fromGas;
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
