import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import heroImage from "../assets/tvk-vijay-rally.jpg?url";

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
        content:
          "Report civic issues in your area and track their resolution online.",
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

function Index() {
  return (
    <div>
      {/* Hero */}
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

      {/* Categories */}
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

      {/* How it works */}
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
              Start now — it's free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
