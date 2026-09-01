import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FilePlus2,
  Loader2,
  CheckCircle2,
  Copy,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/file")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "File a Complaint — CivicPulse" },
      {
        name: "description",
        content:
          "Report a civic issue in your area: roads, garbage, streetlights, water, parks, or traffic. Get an instant tracking code.",
      },
      { property: "og:title", content: "File a Complaint — CivicPulse" },
      {
        property: "og:description",
        content: "Report a civic issue in your area and get an instant tracking code.",
      },
    ],
  }),
  component: FileComplaint,
});

const CATEGORIES = [
  "Roads & Potholes",
  "Sanitation & Garbage",
  "Street Lighting",
  "Water & Drainage",
  "Parks & Trees",
  "Traffic & Safety",
  "Other",
];

const complaintSchema = z.object({
  title: z.string().trim().min(5, "Give the issue a short title (min 5 characters)").max(120),
  category: z.string().min(1, "Please choose a category"),
  description: z.string().trim().min(20, "Please describe the issue in at least 20 characters").max(2000),
  location: z.string().trim().min(5, "Please enter the location of the issue").max(200),
  ward: z.string().trim().max(50).optional(),
  contact_name: z.string().trim().min(2, "Please enter your name").max(100),
  contact_email: z.string().trim().email("Please enter a valid email address"),
  contact_phone: z.string().trim().max(20).optional(),
});

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25";

function FileComplaint() {
  const { category } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category: category ?? "",
    description: "",
    location: "",
    ward: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = complaintSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    const ref =
      "CMP-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    const { error: dbError } = await supabase.from("complaints").insert({
      ...parsed.data,
      ward: parsed.data.ward || null,
      contact_phone: parsed.data.contact_phone || null,
      reference_code: ref,
    });
    setSubmitting(false);
    if (dbError) {
      setError("Could not submit your complaint. Please try again in a moment.");
      return;
    }
    setReferenceCode(ref);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyCode() {
    if (!referenceCode) return;
    navigator.clipboard.writeText(referenceCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (referenceCode) {
    return (
      <div className="texture-dots mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="font-display mt-6 text-3xl text-foreground">
            Complaint filed successfully
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your complaint has been registered and routed to the responsible
            department. Save this tracking code — you'll need it to check the
            status.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <code className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-3 font-mono text-xl font-bold tracking-widest text-primary">
              {referenceCode}
            </code>
            <button
              onClick={copyCode}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Copy tracking code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs font-semibold text-success">Copied to clipboard</p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/track", search: { ref: referenceCode } })}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Track this complaint
            </button>
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="texture-dots mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <FilePlus2 className="h-3.5 w-3.5" />
          New complaint
        </span>
        <h1 className="font-display mt-4 text-3xl text-foreground sm:text-4xl">
          File a complaint
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fields marked <span className="text-destructive">*</span> are required.
          Your contact details are used only for updates about this complaint.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-foreground">
            Issue title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            className={inputClass}
            placeholder="e.g. Large pothole near bus stop"
            value={form.title}
            onChange={set("title")}
            maxLength={120}
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <select id="category" className={inputClass} value={form.category} onChange={set("category")}>
            <option value="">Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-foreground">
            Describe the issue <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            className={inputClass + " min-h-28 resize-y"}
            placeholder="What is the problem? Since when? How does it affect you and your neighbours?"
            value={form.description}
            onChange={set("description")}
            maxLength={2000}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Location <span className="text-destructive">*</span>
              </span>
            </label>
            <input
              id="location"
              className={inputClass}
              placeholder="Street, landmark, or address"
              value={form.location}
              onChange={set("location")}
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="ward" className="mb-1.5 block text-sm font-semibold text-foreground">
              Ward / Zone
            </label>
            <input
              id="ward"
              className={inputClass}
              placeholder="e.g. Ward 12"
              value={form.ward}
              onChange={set("ward")}
              maxLength={50}
            />
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Your contact details
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contact_name" className="mb-1.5 block text-sm font-semibold text-foreground">
                Full name <span className="text-destructive">*</span>
              </label>
              <input
                id="contact_name"
                className={inputClass}
                placeholder="Your name"
                value={form.contact_name}
                onChange={set("contact_name")}
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="contact_email" className="mb-1.5 block text-sm font-semibold text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="contact_email"
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={form.contact_email}
                onChange={set("contact_email")}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="contact_phone" className="mb-1.5 block text-sm font-semibold text-foreground">
                Phone (optional)
              </label>
              <input
                id="contact_phone"
                type="tel"
                className={inputClass}
                placeholder="For SMS updates"
                value={form.contact_phone}
                onChange={set("contact_phone")}
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <FilePlus2 className="h-4 w-4" />
              Submit complaint
            </>
          )}
        </button>
      </form>
    </div>
  );
}
