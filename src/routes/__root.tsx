import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Landmark, FilePlus2, Search, Phone, Mail, Clock } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page does not exist.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or go home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-foreground/10 bg-navy text-navy-foreground">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:min-h-16 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-civic text-civic-foreground">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="font-display truncate text-base tracking-tight sm:text-lg">
            VETRI <span className="text-civic">SEMBAKKAM</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/file"
            search={{}}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-civic px-3 py-2 text-sm font-semibold text-civic-foreground"
          >
            <FilePlus2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">File a Complaint</span>
            <span className="sm:hidden">File</span>
          </Link>
          <Link
            to="/track"
            search={{}}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-navy-foreground/80"
          >
            <Search className="h-4 w-4 shrink-0" />
            Track
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-navy-foreground/10 bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-civic text-civic-foreground">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="font-display text-lg">
              VETRI <span className="text-civic">SEMBAKKAM</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-navy-muted">
            Vetri — civic complaint portal for Sembakkam.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-muted">
            Helpline
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-civic" /> 1800-425-1900
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-civic" /> grievances@tvksembakkam.city
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-civic" /> Mon–Sat, 9:00–18:00
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-muted">
            Links
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/file" search={{}} className="text-navy-foreground/80 hover:text-civic">
                File a complaint
              </Link>
            </li>
            <li>
              <Link to="/track" search={{}} className="text-navy-foreground/80 hover:text-civic">
                Track status
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-navy-foreground/50 hover:text-civic">
                Staff
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-foreground/10 py-4 text-center text-xs text-navy-muted">
        © 2026 Vetri · TVK Sembakkam · Built & developed by Dilli Ganesh
      </div>
    </footer>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </QueryClientProvider>
  );
}
