import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Shield,
  LogOut,
  Loader2,
  CheckCircle2,
  CircleDashed,
  Wrench,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Tag,
  CalendarDays,
} from "lucide-react";
import {
  listComplaintsForStaff,
  updateComplaintStatus,
  isAdminLoggedIn,
  setAdminLoggedIn,
  ADMIN_PASSWORD,
  statusLabel,
  isCloudConfigured,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/complaints";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff — Vetri Sembakkam" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "submitted", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-700",
  in_progress: "bg-blue-500/15 text-blue-700",
  resolved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-red-500/15 text-red-700",
};

const STATUS_ICON: Record<string, typeof CircleDashed> = {
  submitted: CircleDashed,
  in_progress: Wrench,
  resolved: CheckCircle2,
  rejected: XCircle,
};

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25";

function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isAdminLoggedIn());
  }, []);

  useEffect(() => {
    if (loggedIn) void refresh();
  }, [loggedIn]);

  async function refresh() {
    setComplaints(await listComplaintsForStaff());
  }

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    if (password === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setLoggedIn(true);
      setPassword("");
    } else {
      setLoginError("Incorrect password.");
    }
  }

  function handleLogout() {
    setAdminLoggedIn(false);
    setLoggedIn(false);
  }

  async function handleStatusChange(code: string, status: ComplaintStatus, notes: string) {
    setSavingId(code);
    setMessage(null);
    const updated = await updateComplaintStatus(code, status, notes.trim() || null);
    setSavingId(null);
    if (updated) {
      setMessage(`Updated ${code} → ${statusLabel(status)}`);
      await refresh();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage("Could not update. Add Supabase keys on Vercel for shared data.");
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const filtered =
    filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  const counts = {
    all: complaints.length,
    submitted: complaints.filter((c) => c.status === "submitted").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    rejected: complaints.filter((c) => c.status === "rejected").length,
  };

  if (!loggedIn) {
    return (
      <div className="texture-dots mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </span>
          <h1 className="font-display mt-5 text-center text-2xl text-foreground">Staff login</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Update complaint status.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {loginError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {loginError}
              </div>
            )}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              <Shield className="h-4 w-4" />
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="texture-dots mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Complaints</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full details for each case. Set status: Pending → In progress → Resolved.
            {" "}
            {isCloudConfigured() ? "(shared database)" : "(set Supabase on Vercel for shared data)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["submitted", "Pending"],
            ["in_progress", "In Progress"],
            ["resolved", "Resolved"],
            ["rejected", "Rejected"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {label} ({counts[key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No complaints yet</p>
          <Link to="/file" search={{}} className="mt-2 inline-flex text-sm font-semibold text-primary">
            File one
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filtered.map((c) => (
            <AdminComplaintCard
              key={c.reference_code}
              complaint={c}
              saving={savingId === c.reference_code}
              onSave={handleStatusChange}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminComplaintCard({
  complaint,
  saving,
  onSave,
}: {
  complaint: Complaint;
  saving: boolean;
  onSave: (code: string, status: ComplaintStatus, notes: string) => void;
}) {
  const [status, setStatus] = useState<ComplaintStatus>(
    (complaint.status as ComplaintStatus) || "submitted"
  );
  const [notes, setNotes] = useState(complaint.admin_notes ?? "");
  const Icon = STATUS_ICON[complaint.status] ?? CircleDashed;

  useEffect(() => {
    setStatus((complaint.status as ComplaintStatus) || "submitted");
    setNotes(complaint.admin_notes ?? "");
  }, [complaint]);

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/50 px-5 py-3">
        <code className="font-mono text-sm font-bold tracking-wider text-primary">
          {complaint.reference_code}
        </code>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            STATUS_BADGE[complaint.status] ?? "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {statusLabel(complaint.status)}
        </span>
      </header>

      <div className="px-5 py-4">
        <h2 className="text-lg font-bold text-foreground">{complaint.title}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</dt>
              <dd>{complaint.category}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</dt>
              <dd>
                {complaint.location}
                {complaint.ward ? ` · ${complaint.ward}` : ""}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filed</dt>
              <dd>
                {new Date(complaint.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </div>
          </div>
        </dl>
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/90">{complaint.description}</p>
        </div>
        {(complaint.contact_name || complaint.contact_phone || complaint.contact_email) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Contact: {complaint.contact_name}
            {complaint.contact_phone ? ` · ${complaint.contact_phone}` : ""}
            {complaint.contact_email ? ` · ${complaint.contact_email}` : ""}
          </p>
        )}

        <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_2fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes (visible to citizen)
            </label>
            <input
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Team visiting tomorrow"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(complaint.reference_code, status, notes)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60 sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
