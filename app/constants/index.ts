import type { WorkspaceDataSettings } from "~/types";

// ─── Route Paths ────────────────────────────────────────────────────────────
export const ROUTES = {
  DIALER: "/",
  SETTINGS: "/settings",
  TCN_CALLBACK: "/authz/callback",
} as const;

// ─── API Defaults ───────────────────────────────────────────────────────────
export const DEFAULT_API_BASE_URL = "http://localhost:3000/api/v1";
export const DEFAULT_WORKSPACE_ID = "prod";

// ─── Solution Context Defaults ──────────────────────────────────────────────
// Used for the `x-bluecopa-solution-*` SDK headers (Input Table V2 / deployed
// solutions). There is no guaranteed branch named `local` — the default branch
// on a solution is `main`/`REMOTE`.
export const DEFAULT_SOLUTION_BRANCH = "main";
export const DEFAULT_SOLUTION_BRANCH_TYPE = "REMOTE";

/** React Query defaults */
export const QUERY_DEFAULTS = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  RETRY: 1,
} as const;

// ─── Workspace Defaults ─────────────────────────────────────────────────────
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceDataSettings = {
  currency: "USD",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY HH:mm:ss",
  fiscalYear: { yearType: "calendar_year" },
  numberSettings: { numberSystem: "intl", defaultPrecision: 2 },
  weekStartDay: "SUNDAY",
};

// ─── Breakpoints ────────────────────────────────────────────────────────────
export const MOBILE_BREAKPOINT = 768;
