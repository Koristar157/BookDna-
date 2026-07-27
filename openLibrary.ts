import type { BookSummary, SearchFilters, SearchResult } from "./types";

const BASE = "https://openlibrary.org";
const COVERS = "https://covers.openlibrary.org/b";

// Open Library requires no API key. All requests are real, live, and rate-limited
// by Open Library itself (please cache aggressively in production — see README).

interface OLSearchDoc {
  key: string; // "/works/OL45804W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  subject?: string[];
  cover_i?: number;
}

function coverUrl(coverId?: number, isbn?: string | null): string | null {
  if (coverId) return `${COVERS}/id/${coverId}-L.jpg`;
  if (isbn) return `${COVERS}/isbn/${isbn}-L.jpg`;
  return null;
}

function workIdFromKey(key: string): string {
  return key.replace("/works/", "");
}

function toSummary(doc: OLSearchDoc): BookSummary {
  return {
    workId: workIdFromKey(doc.key),
    title: doc.title,
    authors: doc.author_name ?? [],
    coverUrl: coverUrl(doc.cover_i, doc.isbn?.[0] ?? null),
    firstPublishYear: doc.first_publish_year ?? null,
    isbn: doc.isbn?.[0] ?? null,
    subjects: doc.subject?.slice(0, 12) ?? [],
  };
}

async function safeFetchJson<T>(url: string, revalidateSeconds = 3600): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: { "User-Agent": "BookDNA/0.1 (contact: set-your-contact-email)" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Network failure, timeout, or malformed response. Callers must treat
    // a null return as "no real data available" — never substitute a fake result.
    return null;
  }
}

/**
 * Full-text-ish search with typo tolerance provided natively by Open Library's
 * search index. Supports title / author / isbn / general keyword queries.
 */
export async function searchBooks(filters: SearchFilters, limit = 24, page = 1): Promise<SearchResult> {
  const params = new URLSearchParams();
  const queryParts: string[] = [];
  if (filters.query) queryParts.push(filters.query);
  if (filters.genre) queryParts.push(`subject:"${filters.genre}"`);
  if (filters.trope) queryParts.push(`subject:"${filters.trope}"`);
  if (filters.theme) queryParts.push(`subject:"${filters.theme}"`);

  if (queryParts.length === 0) {
    return { books: [], totalFound: 0, source: "none" };
  }

  params.set("q", queryParts.join(" "));
  params.set("limit", String(limit));
  params.set("offset", String((page - 1) * limit));
  params.set(
    "fields",
    "key,title,author_name,first_publish_year,isbn,subject,cover_i"
  );

  if (filters.minYear) params.set("first_publish_year", `[${filters.minYear} TO ${filters.maxYear ?? 9999}]`);

  const data = await safeFetchJson<{ docs: OLSearchDoc[]; numFound: number }>(
    `${BASE}/search.json?${params.toString()}`,
    900
  );

  if (!data || !data.docs?.length) {
    return { books: [], totalFound: 0, source: "none" };
  }

  let books = data.docs.map(toSummary);

  if (filters.maxPageCount || filters.minPageCount) {
    // Open Library search doesn't expose page count in this endpoint;
    // page-count filtering happens downstream once we fetch editions (see getEditionPageCount).
  }

  return { books, totalFound: data.numFound, source: "open-library" };
}

/** Lightweight autocomplete for the search bar. */
export async function autocomplete(prefix: string, limit = 8): Promise<BookSummary[]> {
  if (!prefix.trim()) return [];
  const data = await safeFetchJson<{ docs: OLSearchDoc[] }>(
    `${BASE}/search.json?q=${encodeURIComponent(prefix)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject`,
    120
  );
  if (!data?.docs) return [];
  return data.docs.map(toSummary);
}

export async function getTrending(period: "daily" | "weekly" = "weekly", limit = 12): Promise<BookSummary[]> {
  const data = await safeFetchJson<{ works: any[] }>(`${BASE}/trending/${period}.json?limit=${limit}`, 1800);
  if (!data?.works) return [];
  return data.works
    .filter((w) => w.key && w.title)
    .map((w: any) =>
      toSummary({
        key: w.key,
        title: w.title,
        author_name: w.author_name,
        first_publish_year: w.first_publish_year,
        isbn: w.isbn,
        subject: w.subject,
        cover_i: w.cover_i,
      })
    );
}

/** Real subject-based browsing: genre, and best-effort mood/trope/theme where Open
 * Library happens to model it as a subject (many tropes are not modeled — those
 * queries will legitimately return an empty list, which the UI must show as
 * "No information available", per spec). */
export async function getBooksBySubject(subject:string,limit=18):Promise<BookSummary[]>{
const MAP:Record<string,string[]>={
fantasy:["fantasy"],romance:["romance"],mystery:["mystery"],horror:["horror"],thriller:["thrillers"],science_fiction:["science_fiction"],historical_fiction:["historical_fiction"],literary_fiction:["fiction"],young_adult:["juvenile_fiction"],cozy:["friendship","family","home"],dark:["gothic","horror"],dark_academia:["gothic","schools"],fast_paced:["thrillers","adventure"],adventure:["adventure"],tearjerker:["grief","loss"],underground:["crime"]};
const slugs=MAP[subject.toLowerCase()]??[subject.toLowerCase().replace(/\s+/g,"_")];
const seen=new Map<string,BookSummary>();
for(const slug of slugs){
const data=await safeFetchJson<{works:any[]}>(`${BASE}/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`,3600);
if(data?.works){for(const w of data.works){const b=toSummary({key:w.key,title:w.title,author_name:(w.authors??[]).map((a:any)=>a.name),first_publish_year:w.first_publish_year,cover_i:w.cover_id,subject:w.subject});seen.set(b.workId,b);}}
}
if(seen.size)return [...seen.values()].slice(0,limit);
const fallback=await safeFetchJson<{docs:OLSearchDoc[]}>(`${BASE}/search.json?q=${encodeURIComponent(subject)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,subject,cover_i`,900);
return fallback?.docs?.map(toSummary)??[];
}

export async function getWorkDetails(workId: string) {
  return safeFetchJson<{
    key: string;
    title: string;
    description?: string | { value: string };
    subjects?: string[];
    covers?: number[];
  }>(`${BASE}/works/${workId}.json`, 3600);
}

export async function getWorkEditions(workId: string, limit = 20) {
  const data = await safeFetchJson<{ entries: any[] }>(
    `${BASE}/works/${workId}/editions.json?limit=${limit}`,
    3600
  );
  return data?.entries ?? [];
}

export async function getAuthorName(authorKey: string): Promise<string | null> {
  const data = await safeFetchJson<{ name: string }>(`${BASE}/authors/${authorKey}.json`, 86400);
  return data?.name ?? null;
}
