/** @type {import('next').NextConfig} */
// Static export for GitHub Pages. The project site lives at re-marked.github.io/handshake, so in
// production we prefix everything with /handshake; in dev it's served at the root. Point a custom
// domain at Pages later → set BASE_PATH="" and it all collapses to root.
const basePath = process.env.NODE_ENV === "production" ? "/handshake" : "";

const nextConfig = {
  output: "export",
  images: { unoptimized: true }, // no image-optimization server on a static host
  basePath,
  trailingSlash: true, // each route → folder/index.html, which static hosts serve cleanly
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
