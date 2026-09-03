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
  listLocalComplaints,
  updateLocalComplaintStatus,
  isAdminLoggedIn,
  setAdminLoggedIn,
  ADMIN_PASSWORD,
  statusLabel,
  type LocalComplaint,
  type ComplaintStatus,
} from "@/lib/local-complaints";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TVK Sembakkam" },
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
  const [complaints, setComplaints] = useState<LocalComplaint[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isAdminLoggedIn());
  }, []);

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn]);

  function refresh() {
    setComplaints(listLocalComplaints());
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

  async function handleStatusChange(
    code: string,
    status: ComplaintStatus,
    notes: string
  ) {
    setSavingId(code);
    setMessage(null);
    const updated = updateLocalComplaintStatus(code, status, notes.trim() || null);
    setSavingId(null);
    if (updated) {
      setMessage(`Updated ${code} → ${statusLabel(status)}`);
      refresh();
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const filtered =
    filter === "all"
      ? complaints
      : complaints.filter((c) => c.status === filter);

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
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </span>
          <h1 className="font-display mt-5 text-center text-2xl text-foreground">
            Admin login
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to manage complaint statuses.
          </p>
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
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Shield className="h-4 w-4" />
              Sign in
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Default password: <code className="rounded bg-muted px-1">admin123</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="texture-dots mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Shield className="h-3.5 w-3.5" />
            Admin panel
          </span>
          <h1 className="font-display mt-3 text-3xl text-foreground">Complaints</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update status from Pending → In Progress → Resolved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
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
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {label} ({counts[key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-semibold text-foreground">No complaints yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            File a complaint on the public form first, then manage it here.
          </p>
          <Link
            to="/file"
            search={{}}
            className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
          >
            Go to file complaint
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
  complaint: LocalComplaint;
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
    <li className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </dt>
              <dd>{complaint.category}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </dt>
              <dd>
                {complaint.location}
                {complaint.ward ? ` · ${complaint.ward}` : ""}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filed
              </dt>
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
        <p className="mt-3 whitespace-pre-line text-sm text-foreground/85">
          {complaint.description}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Contact: {complaint.contact_name}
          {complaint.contact_phone ? ` · ${complaint.contact_phone}` : ""}
          {complaint.contact_email ? ` · ${complaint.contact_email}` : ""}
        </p>

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
              Admin notes (visible to citizen)
            </label>
            <input
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Work order raised, team visiting tomorrow"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(complaint.reference_code, status, notes)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
