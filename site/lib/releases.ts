// Build-time fetch of the app's GitHub releases — shared by /changelog and /feed.xml. Runs during
// `next build` (static export), so the live site always reflects releases as of its last deploy;
// pages.yml also triggers on `release: published`, so shipping a release rebuilds the site.

export interface Release {
  tag: string;
  name: string;
  publishedAt: string; // ISO
  body: string; // markdown release notes
  htmlUrl: string;
}

const API = "https://api.github.com/repos/re-marked/handshake/releases?per_page=50";

export async function getReleases(): Promise<Release[]> {
  try {
    const res = await fetch(API, {
      headers: {
        Accept: "application/vnd.github+json",
        // GitHub's API rejects requests without a User-Agent.
        "User-Agent": "handshake-site-build",
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      tag_name: string;
      name: string | null;
      published_at: string;
      body: string | null;
      html_url: string;
      draft: boolean;
      prerelease: boolean;
    }[];
    return data
      .filter((r) => !r.draft && !r.prerelease)
      .map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        publishedAt: r.published_at,
        body: r.body ?? "",
        htmlUrl: r.html_url,
      }));
  } catch {
    // Offline local build etc. — the page renders a graceful fallback.
    return [];
  }
}

export function releaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
