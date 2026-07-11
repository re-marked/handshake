// next/image with `unoptimized` (and internal routes under a basePath) don't get the /handshake
// prefix automatically on GitHub Pages – do it ourselves. Resolves to /handshake/... in prod, / in dev.
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (p: string) => `${BASE}${p}`;
