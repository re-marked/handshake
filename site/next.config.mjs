/** @type {import('next').NextConfig} */
// Static export for GitHub Pages, served at the custom domain handshake.wtf (apex → Pages via the
// public/CNAME file), so everything lives at the root — no basePath. (History: it used to sit at
// re-marked.github.io/handshake with a /handshake prefix.)
const basePath = "";

const nextConfig = {
  output: "export",
  images: { unoptimized: true }, // no image-optimization server on a static host
  basePath,
  trailingSlash: true, // each route → folder/index.html, which static hosts serve cleanly
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
