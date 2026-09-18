import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FilePlus2,
  Loader2,
  CheckCircle2,
  Copy,
  ArrowRight,
  MapPin,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { createComplaint } from "@/lib/complaints";

export const Route = createFileRoute("/file")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search["category"] === "string"
      ? { category: search["category"] as string }
      : {},
  head: () => ({
    meta: [
      { title: "File a complaint — Vetri Sembakkam" },
      {
        name: "description",
        content: "Report roads, garbage, streetlights, water or drainage issues in Sembakkam.",
      },
      { property: "og:title", content: "File a complaint — Vetri Sembakkam" },
      {
        property: "og:description",
        content: "Report civic issues and get a tracking code.",
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
] as const;

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  category: z.string().min(1, "Select a category"),
  description: z.string().min(15, "Please describe the issue in more detail").max(2000),
  location: z.string().min(3, "Enter a location").max(200),
  ward: z.string().max(80).optional(),
  contact_name: z.string().min(2, "Enter your name").max(80),
  contact_email: z.string().email("Enter a valid email"),
  contact_phone: z
    .string()
    .max(20)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25";

function FileComplaint() {
  const { category: prefillCategory } = Route.useSearch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: prefillCategory && CATEGORIES.includes(prefillCategory as (typeof CATEGORIES)[number])
        ? prefillCategory
        : "",
      description: "",
      location: "",
      ward: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const row = await createComplaint({
        title: values.title.trim(),
        category: values.category,
        description: values.description.trim(),
        location: values.location.trim(),
        ward: values.ward?.trim() || null,
        contact_name: values.contact_name.trim(),
        contact_email: values.contact_email.trim(),
        contact_phone: values.contact_phone || null,
      });
      setSuccessCode(row.reference_code);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save the complaint. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode() {
    if (!successCode) return;
    void navigator.clipboard.writeText(successCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (successCode) {
    return (
      <div className="texture-dots mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="font-display mt-5 text-2xl text-foreground">Complaint filed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Keep this tracking code. A confirmation email has been sent if you provided a valid address.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <code className="rounded-md bg-secondary px-4 py-2.5 font-mono text-lg font-bold tracking-wider text-primary">
              {successCode}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-xs font-medium text-emerald-700">Copied</p>
          )}
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/track"
              search={{ ref: successCode }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Track status
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessCode(null);
                form.reset();
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"
            >
              File another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="texture-dots mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Vetri · TVK Sembakkam
        </p>
        <h1 className="font-display mt-2 text-3xl text-foreground sm:text-4xl">
          File a civic complaint
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Roads, garbage, streetlights, water, drainage — describe the issue and get a tracking code.
          No login needed. Staff will update the status and you can follow it online.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          CM of Tamil Nadu · Minister Sarathkumar · Helpline 1800-7574-1234
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-7"
      >
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="mb-1.5 block text-sm font-semibold">
            Short title <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            className={inputClass}
            placeholder="e.g. Large pothole near bus stop"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-semibold">
            Category <span className="text-destructive">*</span>
          </label>
          <select id="category" className={inputClass} {...form.register("category")}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {form.formState.errors.category && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-semibold">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            className={inputClass}
            placeholder="What is the problem? When did it start? Any landmarks?"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Location <span className="text-destructive">*</span>
            </label>
            <input
              id="location"
              className={inputClass}
              placeholder="Street / area in Sembakkam"
              {...form.register("location")}
            />
            {form.formState.errors.location && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="ward" className="mb-1.5 block text-sm font-semibold">
              Ward / landmark (optional)
            </label>
            <input
              id="ward"
              className={inputClass}
              placeholder="e.g. Ward 3, near temple"
              {...form.register("ward")}
            />
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <h2 className="text-sm font-bold text-foreground">Your contact (for updates)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We email you a confirmation and status changes. Phone is optional.
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contact_name" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                <User className="h-3.5 w-3.5 text-primary" />
                Name <span className="text-destructive">*</span>
              </label>
              <input
                id="contact_name"
                className={inputClass}
                placeholder="Your full name"
                {...form.register("contact_name")}
              />
              {form.formState.errors.contact_name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.contact_name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="contact_phone" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                <Phone className="h-3.5 w-3.5 text-primary" />
                Phone (optional)
              </label>
              <input
                id="contact_phone"
                className={inputClass}
                placeholder="10-digit mobile"
                inputMode="tel"
                {...form.register("contact_phone")}
              />
            </div>
          </div>
          <div className="mt-5">
            <label htmlFor="contact_email" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Email <span className="text-destructive">*</span>
            </label>
            <input
              id="contact_email"
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              {...form.register("contact_email")}
            />
            {form.formState.errors.contact_email && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.contact_email.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 sm:w-auto"
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
