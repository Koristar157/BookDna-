# BookDNA

An intelligent book discovery platform. Every book on this site is real, live
data from Open Library and Google Books — nothing is fabricated. Where real
data isn't available for a field, the UI says "No information available."
instead of inventing something.

## What's actually built vs. scaffolded

**Fully working, real, live data — no setup beyond `npm install`:**
- Homepage rails (Trending, Recently Popular, Award Winners, Hidden Gems) —
  live from Open Library
- Search (title/author/ISBN/keyword) with autocomplete, typo tolerance via
  Open Library's own index
- Natural-language "AI Recommendation Search" — deterministic keyword/negation
  parser by default (works with zero API keys), upgrades automatically to
  real Claude-based parsing if you set `ANTHROPIC_API_KEY`
- Book detail pages — live description/cover/publisher/page count, Schema.org
  `Book` structured data, dynamic SEO metadata, OpenGraph tags
- BookDNA trait bars — a transparent heuristic computed from each book's real
  subjects/description (labeled clearly as derived analysis, not an official
  rating, per spec)
- Affiliate buy links (Amazon/B&N/Bookshop.org/Kobo) — real search URLs by
  default, add your affiliate IDs as env vars to tag them
- Genre/mood browse pages, sitemap.xml, robots.txt

**Scaffolded — schema and code are real, but need YOUR accounts to activate:**
- User accounts, shelves, reviews, reading stats → `supabase/schema.sql` has
  the full Postgres schema + RLS policies. Create a Supabase project, run
  that file, add the URL/keys to `.env.local`, and wire the UI in
  `app/account/page.tsx` to `@supabase/auth-helpers-nextjs`.
- Admin dashboard, blog, search analytics → tables are in the schema
  (`search_log`, `flagged_content`); build the admin UI against them once
  you have real usage data — no fake seed data is included on purpose.
- Meilisearch (for scale search past what Open Library's API comfortably
  handles) → add `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY`, then swap
  `lib/openLibrary.ts`'s `searchBooks` to query your Meilisearch index
  (which you'd populate from an Open Library data dump).

## Known, honest limitations

- **Moods/tropes**: Open Library only models some of these as real subjects
  ("cozy", "heist" often resolve; niche tropes like "enemies to lovers" may
  return nothing). That's not a bug — per the project's own rule, an empty
  real result is shown as "No information available," never backfilled with
  invented books.
- **Award Winners / Hidden Gems**: there's no free "official award winner"
  API. These currently query the closest real Open Library subject as a
  best-effort proxy. Swapping in the NYT Best Sellers API (requires a free
  key) would make Award Winners authoritative — the fetch layer is isolated
  in `lib/openLibrary.ts` so this is a contained change.
- **Rate limits**: Open Library asks for a real `User-Agent` and reasonable
  request volume. `next: { revalidate }` caching is already set on every
  fetch — raise those numbers before you get real traffic.
- **Scale to "millions of books"**: this architecture (Next.js hitting Open
  Library/Google Books live, with Next's built-in fetch caching) comfortably
  handles real traffic at moderate scale. True 10M-book, high-QPS scale needs
  the Meilisearch layer above, populated from Open Library's full data dumps
  rather than live API calls per request.

## Setup

```bash
npm install
cp .env.example .env.local
# Open Library needs no key. Everything else in .env.local is optional —
# the site works with zero keys, and upgrades as you add them.
npm run dev
```

Then open http://localhost:3000.

## Deploying

This is a standard Next.js 14 App Router project — deploys to Vercel with
zero config (`vercel deploy`). Add your `.env.local` values as Vercel
Environment Variables.

## Project structure

```
app/                 Routes (App Router)
  api/                API route handlers (search, autocomplete, ai-search)
  book/[workId]/      Book detail page
  browse/genre|mood/  Subject browse pages
  search/             Search results page
components/           UI components
lib/
  openLibrary.ts      Primary data source
  googleBooks.ts       Secondary data source (descriptions/thumbnails)
  bookdna-traits.ts    Heuristic trait scoring (transparent, inspectable)
  ai-parser.ts         Natural-language → filters
  supabase.ts          DB client factories
supabase/schema.sql   Full Postgres schema for accounts/shelves/reviews
```
