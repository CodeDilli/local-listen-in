import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FilePlus2,
  Search,
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  TreePine,
  TrafficCone,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  MapPin,
  Tag,
} from "lucide-react";
import heroImage from "../assets/tvk-vijay-rally.jpg?url";
import {
  listLocalComplaints,
  statusLabel,
  type LocalComplaint,
} from "@/lib/local-complaints";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TVK Sembackkam — File & Track Public Complaints in Your Area" },
      {
        name: "description",
        content:
          "Report potholes, garbage, broken streetlights, water issues and more in your neighbourhood. Get a tracking code and follow resolution online.",
      },
      { property: "og:title", content: "TVK Sembackkam — File & Track Public Complaints" },
      {
        property: "og:description",
        content: "Report civic issues in your area and track their resolution online.",
      },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { icon: Construction, label: "Roads & Potholes", desc: "Damaged roads, potholes, broken pavements" },
  { icon: Trash2, label: "Sanitation & Garbage", desc: "Uncollected waste, overflowing bins, dumping" },
  { icon: Lightbulb, label: "Street Lighting", desc: "Broken or flickering streetlights, dark spots" },
  { icon: Droplets, label: "Water & Drainage", desc: "Leaks, shortages, blocked drains, flooding" },
  { icon: TreePine, label: "Parks & Trees", desc: "Fallen trees, park upkeep, encroachment" },
  { icon: TrafficCone, label: "Traffic & Safety", desc: "Signal faults, illegal parking, hazards" },
];

const STEPS = [
  {
    icon: FilePlus2,
    title: "1. File your complaint",
    desc: "Describe the issue, pick a category, and pin the location. It takes under two minutes — no account needed.",
  },
  {
    icon: ClipboardList,
    title: "2. Get a tracking code",
    desc: "You'll instantly receive a unique reference code for your complaint. Save it — it's your receipt.",
  },
  {
    icon: Search,
    title: "3. Track resolution",
    desc: "Check the status any time with your code and see updates as the responsible department acts.",
  },
];

const BADGE: Record<string, string> = {
  submitted: "bg-amber-500/15 text-amber-800",
  in_progress: "bg-blue-500/15 text-blue-800",
  resolved: "bg-emerald-500/15 text-emerald-800",
  rejected: "bg-red-500/15 text-red-800",
};

function Index() {
  const [complaints, setComplaints] = useState<LocalComplaint[]>([]);
  const [filter, setFilter] = useState<"all" | "resolved" | "open">("all");

  useEffect(() => {
    setComplaints(listLocalComplaints());
  }, []);

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "submitted").length;
  const inProgress = complaints.filter((c) => c.status === "in_progress").length;
  const resolved = complaints.filter((c) => c.status === "resolved").length;
  const awaiting = pending + inProgress;

  const visible = complaints
    .filter((c) => {
      if (filter === "resolved") return c.status === "resolved";
      if (filter === "open") return c.status === "submitted" || c.status === "in_progress";
      return true;
    })
    .slice(0, 12);

  return (
    <div>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <img
          src={heroImage}
          alt="TVK Vijay addressing a public rally"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60" aria-hidden />
        <div className="texture-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-civic/40 bg-civic/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-civic">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official public grievance portal
            </span>
            <h1 className="font-display mt-6 text-4xl leading-tight sm:text-5xl lg:text-6xl">
              Your city listens.
              <span className="block text-civic">Report it. Track it. Fixed.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-muted sm:text-lg">
              See a pothole, a broken streetlight, or uncleared garbage in your
              area? File a complaint in two minutes and follow it through to
              resolution — no queues, no paperwork.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/file"
                search={{}}
                className="inline-flex items-center gap-2 rounded-md bg-civic px-6 py-3 text-sm font-bold text-civic-foreground shadow-lg shadow-civic/20 transition-transform hover:-translate-y-0.5"
              >
                <FilePlus2 className="h-4 w-4" />
                File a Complaint
              </Link>
              <Link
                to="/track"
                search={{}}
                className="inline-flex items-center gap-2 rounded-md border border-navy-foreground/25 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
              >
                <Search className="h-4 w-4" />
                Track a Complaint
              </Link>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-civic/10 blur-3xl"
          aria-hidden
        />
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-foreground sm:text-3xl">
                Public accountability dashboard
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Live numbers and a public log of issues raised by residents.
                Resolved work is shown openly so everyone can see progress.
              </p>
            </div>
            <Link
              to="/track"
              search={{}}
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Track your complaint →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard icon={Inbox} label="Complaints filed" value={total} hint="Total registered" />
            <StatCard
              icon={Clock}
              label="Awaiting action"
              value={awaiting}
              hint={`${pending} pending · ${inProgress} in progress`}
              accent="text-amber-700"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={resolved}
              hint="Closed with department update"
              accent="text-emerald-700"
            />
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-foreground">Recent public log</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["open", "Open"],
                    ["resolved", "Resolved"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="font-semibold text-foreground">No public entries yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When residents file complaints, they appear here for transparency.
                </p>
                <Link
                  to="/file"
                  search={{}}
                  className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Be the first to file
                </Link>
              </div>
            ) : (
              <ul className="mt-6 grid gap-3">
                {visible.map((c) => (
                  <li
                    key={c.reference_code}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-xs font-bold tracking-wider text-primary">
                            {c.reference_code}
                          </code>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              BADGE[c.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {statusLabel(c.status)}
                          </span>
                        </div>
                        <h4 className="mt-1.5 font-semibold text-foreground">{c.title}</h4>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3 text-primary" />
                            {c.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {c.location}
                            {c.ward ? ` · ${c.ward}` : ""}
                          </span>
                          <span>
                            {new Date(c.created_at).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {c.status === "resolved" && c.admin_notes && (
                          <p className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-900">
                            <span className="font-semibold">Department update: </span>
                            {c.admin_notes}
                          </p>
                        )}
                      </div>
                      <Link
                        to="/track"
                        search={{ ref: c.reference_code }}
                        className="shrink-0 text-xs font-semibold text-primary hover:underline"
                      >
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="texture-dots bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">
              What can you report?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six dedicated departments handle complaints by category, so yours
              lands on the right desk from day one.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                to="/file"
                search={{ category: c.label }}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-card-foreground">{c.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Report this <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-center text-3xl text-foreground sm:text-4xl">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/file"
              search={{}}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start now — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-3 text-4xl font-bold tracking-tight ${accent ?? "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
