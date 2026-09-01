import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Loader2,
  MapPin,
  CalendarDays,
  Tag,
  CircleDashed,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track a Complaint — CivicPulse" },
      {
        name: "description",
        content:
          "Enter your complaint tracking code to see the live status and department updates.",
      },
      { property: "og:title", content: "Track a Complaint — CivicPulse" },
      {
        property: "og:description",
        content: "Check the live status of your civic complaint with your tracking code.",
      },
    ],
  }),
  component: TrackComplaint,
});

type Complaint = {
  reference_code: string;
  title: string;
  category: string;
  description: string;
  location: string;
  ward: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<
  string,
  { label: string; icon: typeof CircleDashed; badge: string; step: number }
> = {
  submitted: {
    label: "Submitted",
    icon: CircleDashed,
    badge: "bg-info/15 text-info",
    step: 1,
  },
  in_progress: {
    label: "In Progress",
    icon: Wrench,
    badge: "bg-warning/20 text-warning-foreground",
    step: 2,
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    badge: "bg-success/15 text-success",
    step: 3,
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-destructive/15 text-destructive",
    step: 3,
  },
};

const STEPS = ["Submitted", "In Progress", "Resolved"];

const inputClass =
  "w-full rounded-md border border-input bg-card px-4 py-3 font-mono text-sm uppercase tracking-widest text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25";

function TrackComplaint() {
  const { ref } = Route.useSearch();
  const [code, setCode] = useState(ref ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Complaint | null>(null);
  const [searched, setSearched] = useState(false);

  async function lookup(raw: string) {
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    const { data, error: dbError } = await supabase
      .from("complaints")
      .select(
        "reference_code, title, category, description, location, ward, status, admin_notes, created_at, updated_at"
      )
      .eq("reference_code", trimmed)
      .maybeSingle();
    setLoading(false);
    if (dbError) {
      setError("Something went wrong while looking up your complaint. Please try again.");
      setResult(null);
      return;
    }
    setResult(data);
  }

  useEffect(() => {
    if (ref) void lookup(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const meta = result ? STATUS_META[result.status] ?? STATUS_META.submitted : null;

  return (
    <div className="texture-dots mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Search className="h-3.5 w-3.5" />
          Status lookup
        </span>
        <h1 className="font-display mt-4 text-3xl text-foreground sm:text-4xl">
          Track a complaint
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the tracking code you received when filing (e.g. CMP-1A2B3C4D).
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code);
        }}
        className="mt-8 flex gap-2"
      >
        <input
          className={inputClass}
          placeholder="Enter tracking code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={20}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">Track</span>
        </button>
      </form>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {searched && !loading && !error && !result && (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-semibold text-foreground">No complaint found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check the code and try again, or{" "}
            <Link to="/file" className="font-semibold text-primary underline underline-offset-2">
              file a new complaint
            </Link>
            .
          </p>
        </div>
      )}

      {result && meta && (
        <article className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary px-6 py-4">
            <code className="font-mono text-sm font-bold tracking-widest text-primary">
              {result.reference_code}
            </code>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${meta.badge}`}
            >
              <meta.icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
          </header>

          {result.status !== "rejected" && (
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center">
                {STEPS.map((label, i) => {
                  const done = meta.step > i;
                  const active = meta.step === i + 1;
                  return (
                    <div key={label} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            done || active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            done || active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`mx-2 mb-5 h-0.5 flex-1 rounded ${
                            meta.step > i + 1 ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="px-6 py-6">
            <h2 className="text-xl font-bold text-foreground">{result.title}</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Tag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </dt>
                  <dd className="mt-0.5 text-foreground">{result.category}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {result.location}
                    {result.ward ? ` · ${result.ward}` : ""}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Filed on
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    {new Date(result.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h3>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {result.description}
              </p>
            </div>
            {result.admin_notes && (
              <div className="mt-5 rounded-lg border border-info/30 bg-info/10 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-info">
                  Update from the department
                </h3>
                <p className="mt-1 text-sm text-foreground/90">{result.admin_notes}</p>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
