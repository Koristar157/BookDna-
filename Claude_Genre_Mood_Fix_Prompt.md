# Fix Prompt for Claude

## Problem

The **Browse by Genre** and **Browse by Mood** pages are empty because
the application is passing the UI labels directly to the Open Library
Subjects API.

Many UI values (especially moods) are **not valid Open Library
subjects**, so the API returns no books.

Examples that fail: - dark_academia - fast_paced - tearjerker -
underground - young_adult

The UI labels should **never** be used directly as API subject names.

------------------------------------------------------------------------

## Required Fix

Refactor the application so it uses mapping files instead of passing UI
labels directly.

Create:

-   `lib/genreMap.ts`
-   `lib/moodMap.ts`

### Example `genreMap.ts`

``` ts
export const genreMap = {
  fantasy: "fantasy",
  romance: "romance",
  mystery: "mystery",
  science_fiction: "science_fiction",
  horror: "horror",
  thriller: "thrillers",
  historical_fiction: "historical_fiction",
  literary_fiction: "fiction",
  biography: "biography",
  poetry: "poetry",
  nonfiction: "nonfiction",
  young_adult: "juvenile_fiction"
};
```

### Example `moodMap.ts`

``` ts
export const moodMap = {
  cozy: ["friendship", "home", "family"],
  adventure: ["adventure"],
  emotional: ["love", "family", "grief"],
  dark: ["gothic", "horror"],
  dark_academia: ["gothic", "universities", "schools"],
  fast_paced: ["thrillers", "adventure"],
  tearjerker: ["grief", "loss"],
  underground: ["crime", "secret_societies"]
};
```

------------------------------------------------------------------------

## Update `getBooksBySubject()`

Modify the function so it:

1.  Looks up the mapped subject instead of using the raw UI label.
2.  Supports multiple mapped subjects for moods.
3.  Queries every mapped subject.
4.  Merges all results.
5.  Removes duplicate books using the Open Library Work ID.
6.  Returns up to 36 books.
7.  If no books are found, automatically falls back to:
    `/search.json?q=<keyword>`
8.  Never returns an empty page unless both the subject search and
    keyword search fail.
9.  Log which API endpoint succeeded for debugging.

------------------------------------------------------------------------

## Important Rules

-   Never assume a UI label is an Open Library subject.
-   Never leave Genre or Mood pages empty if fallback search can return
    books.
-   Keep the existing UI exactly the same.
-   Do not hardcode book results.
-   Continue using Open Library as the primary data source.
-   Use keyword search only as a fallback.
