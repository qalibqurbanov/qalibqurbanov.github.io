/** Injected at build time by `config/vite.config.ts` (Vite `define`). */
declare const __BUILD_INFO__: {
  /** Branch the build was made from, e.g. "main". */
  branch: string | null;
  /** Full commit SHA of that build. */
  sha: string | null;
  /** Commit date, ISO 8601. */
  date: string | null;
  /** First line of the commit message. */
  message: string | null;
};
