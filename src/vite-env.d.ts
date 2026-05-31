/// <reference types="vite/client" />

/** Build metadata injected by vite.config.ts (version, timestamp, commit, exact tag if any). */
declare const __BUILD_INFO__: {
  version: string;
  time: string;
  sha: string;
  tag: string;
};
