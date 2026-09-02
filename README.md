# TVK Sembackkam — Public Complaint Portal

A simple, mobile-friendly web app for residents to **file and track civic complaints** in their area (potholes, garbage, streetlights, water, parks, traffic & safety).

No account required. Users get an instant tracking code (e.g. `CMP-1A2B3C4D`) and can check status anytime.

Built with [Lovable](https://lovable.dev) · TanStack Start · React · Supabase · Tailwind.

## Features

- **File a complaint** in under 2 minutes (title, category, description, location, contact)
- **Instant tracking code** on successful submit
- **Live status tracking** (Submitted → In Progress → Resolved / Rejected)
- Department notes visible to the citizen
- Six main categories + Other
- Clean, accessible UI with proper SEO meta tags

## Categories

| Category | Examples |
|----------|----------|
| Roads & Potholes | Damaged roads, potholes, broken pavements |
| Sanitation & Garbage | Uncollected waste, overflowing bins |
| Street Lighting | Broken or flickering lights, dark spots |
| Water & Drainage | Leaks, shortages, blocked drains |
| Parks & Trees | Fallen trees, park upkeep |
| Traffic & Safety | Signal faults, illegal parking, hazards |

## Tech Stack

- **Frontend**: TanStack Start + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend / DB**: Supabase (Postgres)
- **Forms**: Zod validation + React Hook Form patterns
- **Routing**: File-based routes (`/`, `/file`, `/track`)

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project with a `complaints` table

### Setup

```bash
git clone https://github.com/CodeDilli/local-listen-in.git
cd local-listen-in
cp .env.example .env
# Fill in your Supabase values in .env
npm install   # or bun install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Supabase Schema (reference)

The app expects a `complaints` table roughly like:

```sql
create table complaints (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,
  title text not null,
  category text not null,
  description text not null,
  location text not null,
  ward text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  status text not null default 'submitted',
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

(Adjust RLS policies as needed for public insert + public read by `reference_code`.)

## Important Security Note

Never commit real `.env` files. Use `.env.example` as a template. If keys were ever pushed, rotate them in the Supabase dashboard.

## License

Private / All rights reserved (update as needed).
