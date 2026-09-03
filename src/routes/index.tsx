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
      { title: "Vetri Sembakkam — Complaints" },
      {
        name: "description",
        content: "Vetri — file and track civic complaints in Sembakkam.",
      },
      { property: "og:title", content: "Vetri Sembakkam — Complaints" },
      {
        property: "og:description",
        content: "Vetri — file and track civic complaints in Sembakkam.",
      },
    ],
  }),
  component: Index,
});

const CATEGORIES = [
  { icon: Construction, label: "Roads & Potholes", desc: "Potholes, broken roads, damaged footpaths" },
  { icon: Trash2, label: "Sanitation & Garbage", desc: "Uncollected waste, overflowing bins" },
  { icon: Lightbulb, label: "Street Lighting", desc: "Dead or flickering lights, dark stretches" },
  { icon: Droplets, label: "Water & Drainage", desc: "Leaks, shortage, blocked drains, flooding" },
  { icon: TreePine, label: "Parks & Trees", desc: "Fallen trees, park maintenance" },
  { icon: TrafficCone, label: "Traffic & Safety", desc: "Signals, illegal parking, road hazards" },
];

const STEPS = [
  {
    icon: FilePlus2,
    title: "1. File",
    desc: "Describe the problem, choose a category, and give the location. No login needed.",
  },
  {
    icon: ClipboardList,
    title: "2. Get a code",
    desc: "You get a tracking code on the spot. Keep it to check status later.",
  },
  {
    icon: Search,
    title: "3. Track",
    desc: "Enter the code anytime to see status and department notes.",
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
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-30 lg:hidden"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/95 to-navy/80 lg:to-navy/90" aria-hidden />
        <div className="texture-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-24">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-civic">
              Vetri · TVK Sembakkam
            </p>
            <h1 className="font-display mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">
              File a civic complaint.
              <span className="block text-civic">Track it until it is fixed.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-navy-muted sm:text-lg">
              Roads, garbage, streetlights, water, drainage — report local issues and
              follow the status online.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/file"
                search={{}}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-civic px-5 py-2.5 text-sm font-bold text-civic-foreground"
              >
                <FilePlus2 className="h-4 w-4" />
                File a complaint
              </Link>
              <Link
                to="/track"
                search={{}}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-navy-foreground/25 px-5 py-2.5 text-sm font-semibold text-navy-foreground"
              >
                <Search className="h-4 w-4" />
                Track status
              </Link>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-navy-foreground/15 shadow-2xl">
              <img
                src={heroImage}
                alt="Thalapathy Vijay"
                className="aspect-[16/10] w-full object-cover object-center"
              />
            </div>
            <p className="mt-2 text-center text-xs text-navy-muted">Thalapathy Vijay</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Public status board
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Open numbers. Resolved work is listed below.
              </p>
            </div>
            <Link to="/track" search={{}} className="text-sm font-semibold text-primary">
              Track your code →
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard icon={Inbox} label="Filed" value={total} hint="All complaints" />
            <StatCard
              icon={Clock}
              label="Open"
              value={awaiting}
              hint={`${pending} pending · ${inProgress} in progress`}
              accent="text-amber-700"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={resolved}
              hint="Closed by staff"
              accent="text-emerald-700"
            />
          </div>

          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-foreground">Recent complaints</h3>
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
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      filter === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <p className="text-sm font-medium text-foreground">No complaints yet</p>
                <Link
                  to="/file"
                  search={{}}
                  className="mt-2 inline-flex text-sm font-semibold text-primary"
                >
                  File one
                </Link>
              </div>
            ) : (
              <ul className="mt-4 grid gap-2">
                {visible.map((c) => (
                  <li
                    key={c.reference_code}
                    className="rounded-lg border border-border bg-card p-3.5 sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-xs font-bold tracking-wider text-primary">
                            {c.reference_code}
                          </code>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              BADGE[c.status] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {statusLabel(c.status)}
                          </span>
                        </div>
                        <h4 className="mt-1 font-semibold text-foreground">{c.title}</h4>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {c.category}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
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
                          <p className="mt-2 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-900">
                            <span className="font-semibold">Update: </span>
                            {c.admin_notes}
                          </p>
                        )}
                      </div>
                      <Link
                        to="/track"
                        search={{ ref: c.reference_code }}
                        className="shrink-0 text-xs font-semibold text-primary"
                      >
                        View
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
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            What you can report
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick the category that matches the issue.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                to="/file"
                search={{ category: c.label }}
                className="rounded-lg border border-border bg-card p-4"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-card-foreground">{c.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="font-display text-center text-2xl text-foreground sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-foreground">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/file"
              search={{}}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              File a complaint
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${accent ?? "text-foreground"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
