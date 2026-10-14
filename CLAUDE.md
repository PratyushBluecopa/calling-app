# CLAUDE.md — React MFE Boilerplate

This file provides guidance to Claude Code when working with the Bluecopa React MFE (Micro-Frontend) boilerplate. It is the **single source of truth** for agent guidance — `Agent.md` points here.

## Project Overview

A production-ready React microfrontend template for building apps that run inside the Bluecopa platform. Uses single-spa for MFE orchestration, Module Federation for runtime loading, and the Dream Light design system for UI.

## Quick Start

```bash
pnpm dev          # Dev server on port 8080
pnpm build        # TypeScript check + production build
pnpm start        # Serve built MFE on port 3001
pnpm typecheck    # TypeScript validation only
```

## Architecture

### Entry Points

| File | Mode | Router | Use Case |
|------|------|--------|----------|
| `app/main.tsx` | Standalone | `BrowserRouter` | Local development |
| `app/single-spa.tsx` | MFE | `MemoryRouter` | Deployed inside Bluecopa shell |

### MFE Props Interface

```typescript
interface MfeProps {
  apiBaseUrl?: string;     // Bluecopa API URL
  workspaceId?: string;    // Workspace context
  accessToken?: string;    // JWT auth token
  userId?: string;         // Current user ID
  basename?: string;       // Router basename
  envVars?: EnvConfig;     // Runtime env (workbook `storedEnvVariable`) — see below
  schemaMap?: SchemaMap;   // Column-name normalization (workbook `storedSchemaMap`)
  permissions?: PermissionsMap; // Logged-in user's authz check (actionId → permission → granted)
}
```

Props are passed from the host app via single-spa `customProps` or `manualMount()`.

### Runtime config: `envVars` (CRITICAL)

The host injects an `envVars` object built from the app's **Settings → Env Vars** panel
(persisted on the workbook as `storedEnvVariable`). This is the **only** way to configure a
deployed app without a rebuild — build-time `import.meta.env` is empty in the federated
`remoteEntry`. `app.tsx` merges them: `{ ...import.meta.env, ...props.envVars }`, host wins.
The merged object is exposed via `useAppContext().envConfig`. Add each of your app's keys (table
IDs, dataset IDs, …) **explicitly** to the `EnvConfig` interface in `app/types/index.ts` for
type-safe access — prefer this over the index signature, which is only a last-resort fallback for
keys you haven't typed yet.

### Solution-context headers (Input Table V2)

`copaSetConfig` is applied **synchronously** in `app.tsx` (a `useState` initializer, so the first
SDK call already carries the right headers) and **re-applied via a `useEffect`** when the host
pushes new props/env after mount (e.g. a refreshed access token or updated `storedEnvVariable`).
It sets the `x-bluecopa-solution-*` headers from `envVars.VITE_BLUECOPA_SOLUTION_ID` /
`_SOLUTION_BRANCH` / `_SOLUTION_BRANCH_TYPE` — **required by the Input Table V2 SDK
(`copaInputTableDb`)**. Defaults: branch `main`, type `REMOTE`.

### Permissions (authorization)

The host injects a `permissions` prop — the logged-in user's live authorization
check (`actionId → permission → granted`), computed before mount against the
app's access-control matrix. It's exposed via `useAppContext().permissions` and,
more conveniently, the `usePermissions()` hook (`app/hooks/use-permissions.ts`):

```tsx
import { usePermissions } from "~/hooks/use-permissions";

function SendEmailButton() {
  const { can } = usePermissions();
  if (!can("send_email")) return null;                    // any permission grants it
  return <Button>Send</Button>;
}
// can("send_email", "write_with_approval") checks a specific permission.
```

Fail-closed: `permissions` defaults to `{}` (no model configured / non-owner), so
`can()` returns `false`. Configure actions + the permission matrix on the app's
**Settings → Access control** tab in the host; assign users in **Settings →
Authorization → User Permission**.

### Error handling

`app/components/error-boundary.tsx` (`RouteErrorBoundary`) wraps the routed tree in `app.tsx`.
Without it, a render-phase throw unmounts the whole MFE and the host shows a blank div. It
auto-retries once (handles cache-cold races on first mount), then shows a visible error panel
with dev-only diagnostics.

### Key Files

| File | Purpose |
|------|---------|
| `app/app.tsx` | Root component — QueryClient, ChartProvider, MFE config, AppProvider |
| `app/app.css` | Tailwind v4 config + Dream Light theme tokens |
| `app/contexts/app-context.tsx` | User, workspace settings, admin role + `envConfig`/`schemaMap` |
| `app/components/error-boundary.tsx` | `RouteErrorBoundary` — wraps routes, auto-retry-once |
| `app/routes/index.tsx` | Route definitions (all wrapped in AppLayout) |
| `app/utils/utils.ts` | `cn()` utility with `copa` prefix support |
| `app/utils/component-style.ts` | Unprefixed style tokens (source of truth) |
| `app/utils/style-drivers.ts` | Auto-prefixes style tokens with `copa:` |
| `vite.config.ts` | Vite + Module Federation + Tailwind v4 |
| `components.json` | shadcn CLI config (prefix: `copa`) |

### Directory Layout

```
app/
├── components/
│   ├── ui/              # shadcn/Dream Light components (prefixed)
│   ├── charts/          # ECharts-based chart components (BarChart, DonutChart, etc.)
│   └── layouts/         # AppLayout, AppSidebar, SiteHeader, NavMain, NavUser
├── constants/           # Route paths, API defaults, query defaults, breakpoints
├── contexts/            # AppContext (user, workspace, settings)
├── hooks/               # use-mobile.ts (768px breakpoint)
├── pages/               # Page components (dashboard, settings, etc.)
├── routes/              # Route config
├── types/               # MfeProps, AppUser, WorkspaceDataSettings
└── utils/               # cn(), style drivers
```

### Layout Structure

```
AppLayout (SidebarProvider)
├── AppSidebar (collapsible, Cmd/Ctrl+B toggle)
│   ├── NavMain (navigation items)
│   └── NavUser (user menu footer)
└── SidebarInset
    ├── SiteHeader (breadcrumbs, user dropdown)
    └── <Outlet /> (page content)
```

## Tailwind v4 + `copa:` Prefix — CRITICAL

All Tailwind classes MUST use the `copa:` prefix for MFE CSS isolation.

### Prefix Order Rule

**Prefix ALWAYS comes first**, then variants, then utility:

```
{prefix}:{variants}:{utility}
```

```tsx
// CORRECT
className="copa:flex copa:items-center copa:hover:bg-accent copa:md:block"
className="copa:group-data-[state=open]:block"

// WRONG — silently fails, no CSS generated, no errors
className="hover:copa:bg-accent"   // ← variant before prefix
className="md:copa:block"          // ← breakpoint before prefix
```

### CSS Architecture (app.css)

Three layers in order:

1. **`@theme` (build-time)** — Resolved at compile time. Cannot use `var()` refs to runtime CSS variables. Must hardcode values.
2. **`@theme inline` (runtime)** — Binds to CSS variables from `.mfe-root`. Used for dynamic radius, colors.
3. **`.mfe-root` (scoped vars)** — All CSS variables scoped here, NOT `:root`. This prevents MFE style leaking.

### cn() Utility

```typescript
import { cn } from "~/utils/utils";

// Handles copa: prefix correctly via extendTailwindMerge({ prefix: "copa" })
<div className={cn("copa:flex copa:gap-2", isActive && "copa:bg-accent", className)} />
```

### Style Drivers

For reusable style tokens, define unprefixed in `component-style.ts`, consume prefixed from `style-drivers.ts`:

```typescript
// component-style.ts (write unprefixed)
export const styles = {
  card: "rounded-lg border bg-card text-card-foreground shadow-sm",
};

// style-drivers.ts (auto-prefixes)
// "rounded-lg border ..." → "copa:rounded-lg copa:border ..."

// Usage
import { prefixedStyles } from "~/utils/style-drivers";
<div className={prefixedStyles.card} />
```

## @bluecopa/react — API Integration

React Query hooks wrapping `@bluecopa/core`. All data fetching uses these hooks.

### Setup Flow

1. `copaSetConfig()` called **synchronously** in `app.tsx` (a `useState` initializer) from merged MFE props + env vars, then **re-applied via a `useEffect`** when those props/env change
2. `QueryClientProvider` wraps the app (staleTime: 5min, retry: 1)
3. Hooks become available in all child components

### Configuration

```typescript
import { copaSetConfig } from "@bluecopa/react";

copaSetConfig({
  apiBaseUrl: "https://develop.bluecopa.com/api/v1",
  workspaceId: "your-workspace-id",
  accessToken: "your-jwt-token",
  userId: "user-id",
});
```

### Environment Variables

```bash
VITE_BLUECOPA_API_URL=https://develop.bluecopa.com/api/v1
VITE_BLUECOPA_WORKSPACE_ID=prod
VITE_BLUECOPA_API_TOKEN=                  # standalone dev only
VITE_BLUECOPA_USER_ID=
VITE_AG_GRID_LICENSE_KEY=

# Solution context (Input Table V2). In a DEPLOYED app these arrive via the
# host's Settings → Env Vars panel (envVars), not this file.
VITE_BLUECOPA_SOLUTION_ID=
VITE_BLUECOPA_SOLUTION_BRANCH=main
VITE_BLUECOPA_SOLUTION_BRANCH_TYPE=REMOTE
```

### Available Hooks

#### User & Auth
- `useUser()` — Current user details
- `useGetAllUsers()` — All workspace users

#### Datasets & Tables
- `useDataset(id, { limit })` — Dataset records
- `useDatasetSample(id)` — Sample data
- `useRows(tableId, { filters, limit, offset, order, order_by })` — Supabase-style filtered rows
- `useInputTable(id, { limitParams, pageParams, sortParams })` — Input table data
- `useGetTableById(id)` — Table metadata
- `useInsertRow()` — Insert row (mutation, auto-invalidates)
- `useUpdateRow()` — Update row (mutation)
- `useDeleteRow()` — Delete row (mutation)

#### Metrics
- `useMetric(id)` — Metric data

#### Workbooks & Worksheets
- `useGetWorkbooksByType(type)` — Filter workbooks
- `useGetPublishedWorkbookById(id)` — Published workbook
- `useGetWorkbookDetails(id)` — Detailed info
- `useSaveWorkbook()` — Save (mutation)
- `usePublishWorkbook()` — Publish (mutation)
- `useGetWorksheets()` — All worksheets
- `useGetWorksheetsByType(type)` — Filter by type

#### Views & Runs
- `useGetViewById(id)` — View details
- `useGetViewsBySheetId(id)` — Views for sheet
- `useGetRunsByViewId(id)` — Run history
- `useGetRunResultById(id)` — Run result

#### Workflows
- `useTriggerWorkflow()` — Trigger execution (mutation)
- `useTriggerHttpWorkflow()` — HTTP trigger (mutation)
- `useGetWorkflowInstanceStatusById(id)` — Check status
- `useGetAllHttpTriggers()` — List triggers

#### Definitions
- `useRunDefinition()` — Execute definition (mutation)
- `useRunPublishedDefinition()` — Published definition (mutation)
- `useRunSampleDefinition()` — Sample definition (mutation)

#### Files
- `useFileUpload()` — Upload to S3 (mutation)
- `useFileDownload()` — Download file (mutation)
- `useGetFileUrlByFileId(id)` — Get file URL

#### Forms
- `useGetFormById(id)` — Form details
- `useGetFormSchema(id)` — Form schema
- `useGetFormData(id)` — Form data
- `useCreateOrUpdateForm()` — Create/update (mutation)

#### Chat & Comments
- `useCreateThread()` — Create thread (mutation)
- `useGetCommentsByThreadId(id)` — Thread comments
- `usePostComment()` — Post comment (mutation)
- `useUpdateComment()` / `useDeleteComment()` — Manage comments

#### Tasks & Inbox
- `useGetTaskDetails(id)` — Task details
- `useMarkTaskDone()` — Complete task (mutation)
- `useReassignTask()` — Reassign (mutation)
- `useGetAllInboxItems()` — Inbox items
- `useMarkItemAsRead()` / `useMarkItemAsUnread()` — Read state

#### Statements
- `useCreateStatementRun()` — Create run (mutation)
- `useGetStatementData(id)` — Statement data

#### Audit & Recon
- `useGetAuditLogs()` — Audit logs
- `useCreateAuditLog()` — Create entry (mutation)
- `useGetAllRecon()` — Reconciliations
- `useRunRecon()` — Run recon (mutation)

#### Pipelines
- `useGetAllTemplatedPipelines()` — Template pipelines

### Re-exports

```typescript
// Available from @bluecopa/react
export * as reactQuery from "@tanstack/react-query";   // QueryClient, useQuery, etc.
export * from "@bluecopa/core";                        // copaSetConfig, copaApi, copaUtils
export { ReactQueryDevtools } from "@tanstack/react-query-devtools";
```

### Hook Usage Pattern

```tsx
import { useDataset } from "@bluecopa/react";

function MyPage() {
  const { data, isLoading, error, refetch } = useDataset("dataset-id", { limit: 100 });

  if (isLoading) return <Skeleton />;
  if (error) return <div>Error: {error.message}</div>;

  // Parse response (handles multiple formats)
  const rows = data?.records || data?.data || data?.rows || (Array.isArray(data) ? data : []);
  return <DataTable data={rows} />;
}
```

## @bluecopa/core — API SDK

Low-level TypeScript SDK. Prefer `@bluecopa/react` hooks in components, use `copaApi` directly only when needed outside React.

### Authentication

Custom header-based auth (not Bearer tokens):
- `X-COPA-TOKEN`: Access token
- `X-COPA-WORKSPACE-ID`: Workspace context

### Direct API Usage

```typescript
import { copaApi } from "@bluecopa/react";

const user = await copaApi.user.getLoggedInUserDetails();
const rows = await copaApi.inputTable.getRows("table-id", { limit: 50 });
await copaApi.inputTable.insertRow("table-id", { name: "New", value: 42 });
```

### WebSocket Integration

```typescript
import { copaUtils } from "@bluecopa/react";

const ws = copaUtils.websocketUtils.WebsocketContextFactory.create("centrifugo", {
  connectionUrl: "wss://...",
  token: "...",
  userId: "...",
});
ws.connect();
ws.bind("channel", "event", (data) => console.log(data));
```

## AppContext

Provides user data, workspace settings, and role info to all components.

### Available Values

```typescript
const {
  user,                      // { userId, email, name, role, currentWorkspace, ... }
  isLoading,                 // User fetch loading state
  error,                     // User fetch error
  refetch,                   // Refetch user data
  isAdmin,                   // Derived: any team contains "admin"
  workspaceIds,              // User's workspace IDs
  teams,                     // User's teams
  users,                     // All workspace users
  currentWorkspaceSettings,  // { currency, timezone, dateFormat, fiscalYear, numberSettings, weekStartDay }
  setCurrency,               // Override currency
} = useAppContext();
```

### Workspace Settings Shape

```typescript
{
  currency: "USD",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY HH:mm:ss",
  fiscalYear: { yearType: "calendar_year", startMonth?, startDate? },
  numberSettings: { numberSystem: "intl", defaultPrecision: 2, nullPlaceholder? },
  weekStartDay: "SUNDAY",
}
```

## Dream Light Design System

The UI design system. Source: `[https://blui.vercel.app/](https://blui.vercel.app/)`
Registry base URL: `https://blui.vercel.app/r/registry.json`

### Adding Components

From either registry via shadcn CLI:

```bash
# Dream Light / Bluecopa UI (preferred)
pnpm dlx shadcn@latest add @bluecopa-ui/button
pnpm dlx shadcn@latest add @bluecopa-ui/dialog
pnpm dlx shadcn@latest add @bluecopa-ui/data-table

# Standard shadcn/ui (fallback)
pnpm dlx shadcn@latest add button
```

Registry URL: `https://blui.vercel.app/r/{name}.json`

### Available Dream Light Components (70+)

**Inputs**: button, input, textarea, checkbox, radio-group, switch, select, select-advanced, combobox, number-input, pills, date-picker, date-range-picker, calendar, toggle

**Navigation**: tabs, horizontal-tabs, vertical-tabs, breadcrumb, pagination, dropdown-menu, command, sidebar, sidebar-with-icons

**Display**: text, badge, alert, avatar, toast, tooltip, spinner, loading-state, skeleton, empty-state, error-boundary, progress, kpi-card, ag-grid-table, data-table

**Containers**: card, section-card, dialog, sheet, side-panel, popover, accordion, scroll-area, separator, stack, kanban, tree-menu, topbar

**Layout**: scaffold, page-container, section, page-header

**Forms**: form-field, form-section, form-error-summary, label, search-box

**Advanced**: filter-builder, stepper, brand-logo, listing-view, listing-table, listing-header

### Design Tokens

#### Colors (OKLCH)

```css
--primary: #3548ff;                        /* Bluecopa blue */
--primary-foreground: oklch(100% 0 0);     /* White on primary */
--background: oklch(0.975 0.005 280);      /* Near-white */
--foreground: oklch(0.145 0 0);            /* Near-black */
--destructive: oklch(0.577 0.245 27.325);  /* Red */
--border: oklch(0.92 0.005 280);           /* Light gray */
--muted: oklch(0.97 0.003 280);
--muted-foreground: oklch(0.556 0 0);
--accent: oklch(0.97 0.003 280);

/* Semantic status */
--status-success: oklch(0.72 0.19 142);
--status-warning: oklch(0.80 0.18 85);
--status-error: oklch(0.63 0.24 25);

/* Sidebar */
--sidebar: oklch(1 0 0);                   /* White */
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-border: oklch(0.92 0.004 280);
```

#### Typography Scale

```css
/* Fluid type scale */
--text-xs: 0.702rem;       /* Small captions */
--text-sm: 0.835rem;       /* Body text, labels */
--text-md: 1.004rem;       /* Prominent body */
--text-lg: 1.21rem;        /* Subheadings */
--text-xl: 1.452rem;       /* Section headers */
--text-2xl: 1.742rem;      /* Large headings */
--text-3xl: 2.093rem;
--text-4xl: 2.505rem;
--text-5xl: 3.013rem;      /* Hero display */

/* Heading tokens */
--text-h1: 3rem;           /* 700 weight */
--text-h2: 2.25rem;        /* 700 */
--text-h3: 1.875rem;       /* 600 */
--text-h4: 1.5rem;         /* 400 */
--text-h5: 1.25rem;        /* 600 */
--text-h6: 1rem;           /* 400 */

/* Font: Satoshi (sans-serif) */
```

#### Custom Typography Utilities (defined in app.css)

```
.text-page-title     → 1.5rem, semibold
.text-section-title  → 0.9375rem, semibold
.text-label          → 0.75rem, uppercase, tracked
.text-value          → 1.75rem, bold
.text-nav-section    → 0.6875rem, uppercase, tracked
```

#### Spacing

```css
--radius: 1rem;
--card-radius: 1.25rem;
--rounded-input: 12px;

/* Motion */
--duration-fast: 100ms;
--duration-normal: 200ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
```

#### Custom Shadow Utilities

```
.shadow-soft-xs      → Subtle card shadow
.shadow-card         → Multi-layer card shadow
.shadow-card-hover   → Elevated hover state
```

### Chart Colors

```css
--chart-1: oklch(0.55 0.15 255);  /* Blue */
--chart-2: oklch(0.62 0.12 175);  /* Teal */
--chart-3: oklch(0.70 0.13 80);   /* Green */
--chart-4: oklch(0.55 0.14 295);  /* Purple */
--chart-5: oklch(0.62 0.12 15);   /* Red */
```

## Build System

### Vite + Module Federation

```
Build Output:
  dist/assets/remoteEntry.js    ← Module Federation entry (SystemJS format)
  dist/assets/remoteEntry.css   ← Single bundled CSS file
```

- **Federation name**: `__copa_ext_app__react_route`
- **Exposed module**: `./App` → `./app/single-spa.tsx`
- **Shared**: `react`, `react-dom` (externalized in build)
- **Format**: SystemJS (for single-spa compatibility)
- **CSS**: Single file, no code splitting

### TypeScript Config

- Path alias: `~/` → `./app/` (via `tsconfig.json` paths + `vite-tsconfig-paths`)
- Target: ES2020, JSX: react-jsx, strict mode

### Docker

```bash
docker build -t bluecopa-mfe .
# Serves dist/ via lightweight HTTP server
```

## MFE Integration

### How the Host App Loads This MFE

```javascript
// 1. Load Module Federation entry
System.import("__copa_ext_app__react_route/App");

// 2. Register with single-spa
registerApplication({
  name: "bluecopa-preview",
  app: () => System.import("__copa_ext_app__react_route/App"),
  activeWhen: ["/app/external"],
  customProps: {
    apiBaseUrl: "https://develop.bluecopa.com/api/v1",
    accessToken: "eyJ...",
    workspaceId: "prod",
    userId: "user-123",
  },
});
```

### Single-spa Lifecycle

- **bootstrap**: No-op
- **mount**: Creates React root in `#single-spa-application:bluecopa-preview`, renders `<MemoryRouter><App {...props} /></MemoryRouter>`
- **unmount**: Calls `root.unmount()`
- **errorBoundary**: Catches errors, renders fallback UI

### Manual Mount API (for non-single-spa hosts)

```typescript
import { manualMount, manualUnmount } from "./single-spa";

await manualMount({
  domElement: document.getElementById("mfe-container"),
  apiBaseUrl: "https://...",
  accessToken: "...",
  workspaceId: "...",
  userId: "...",
  basename: "/app",
});
```

## Charts (ECharts)

Chart components live in `app/components/charts/` and are powered by Apache ECharts via `echarts-for-react`. The `<ChartProvider>` in `app.tsx` bridges CSS design tokens to the ECharts theme.

### Architecture

| File | Purpose |
|------|---------|
| `chart-provider.tsx` | React context — registers ECharts theme from CSS tokens, auto-refreshes on theme change |
| `chart-theme.ts` | Reads `--chart-*` vars from `.mfe-root`, converts OKLCH to hex, builds ECharts theme object |
| `chart-utils.ts` | Composable option builders: `chartTooltip()`, `chartLegend()`, `chartGrid()`, `chartCategoryAxis()`, `chartValueAxis()`, `chartTitle()`, `chartAnimation()`, `chartColors()`, `formatChartValue()`, `formatChartCurrency()` |
| `base-chart.tsx` | Thin wrapper around `echarts-for-react` with loading/empty states, accessibility, responsive resize |
| `bar-chart.tsx` | Configurable bar chart (vertical/horizontal, stacked, click events, value labels) |
| `donut-chart.tsx` | Donut/pie chart with center text, legend, slice interactions |
| `index.ts` | Barrel exports |

### Available Chart Components

#### BarChart

```tsx
import { BarChart } from "~/components/charts";

<BarChart
  data={{
    categories: ["Jan", "Feb", "Mar"],
    series: [{ name: "Revenue", data: [4200, 3800, 5100] }],
  }}
  height={280}
  horizontal={false}       // swap to horizontal bars
  stacked={false}          // stack multiple series
  showValues={false}       // show value labels on bars
  showLegend={true}        // auto-shows if >1 series
  formatValue={(v) => `$${(v / 1000).toFixed(1)}K`}
  onBarClick={({ name, seriesName, value }) => console.log(name, value)}
  loading={false}
  empty={false}
/>
```

#### DonutChart

```tsx
import { DonutChart } from "~/components/charts";

<DonutChart
  data={{
    items: [
      { name: "Payroll", value: 42 },
      { name: "Operations", value: 28 },
      { name: "Marketing", value: 16 },
    ],
  }}
  height={280}
  centerText="100%"        // large text in donut center
  centerSubText="Total"    // smaller text below center
  thickness={60}           // donut ring thickness (%)
  showLegend={true}
  showLabels={false}       // show labels on slices
  onSliceClick={(params) => console.log(params)}
/>
```

#### BaseChart (escape hatch)

For custom ECharts configurations not covered by BarChart/DonutChart:

```tsx
import { BaseChart } from "~/components/charts";
import { chartTooltip, chartGrid, chartCategoryAxis, chartValueAxis } from "~/components/charts/chart-utils";

<BaseChart
  option={{
    ...chartTooltip(),
    ...chartGrid(),
    xAxis: chartCategoryAxis(["A", "B", "C"]),
    yAxis: chartValueAxis(),
    series: [{ type: "line", data: [10, 20, 30], smooth: true }],
  }}
  height={300}
  loading={false}
  ariaLabel="Custom line chart"
/>
```

### Chart Colors

Defined as `--chart-1` through `--chart-5` in `.mfe-root` (app.css). Hardcoded hex fallbacks in `chart-theme.ts` ensure colors render even if CSS vars aren't resolved:

| Token | OKLCH | Hex Fallback | Color |
|-------|-------|-------------|-------|
| `--chart-1` | `oklch(0.55 0.15 255)` | `#2563eb` | Blue |
| `--chart-2` | `oklch(0.62 0.12 175)` | `#0d9488` | Teal |
| `--chart-3` | `oklch(0.70 0.13 80)` | `#ca8a04` | Gold |
| `--chart-4` | `oklch(0.55 0.14 295)` | `#7c3aed` | Purple |
| `--chart-5` | `oklch(0.62 0.12 15)` | `#dc2626` | Red |

The theme auto-extends to 10 colors via tints/shades of the base 5.

### Adding New Chart Types

To add a new chart type (e.g., LineChart, PieChart), follow the pattern in `bar-chart.tsx`:

1. Create `app/components/charts/my-chart.tsx`
2. Use `useMemo` to build an ECharts option from `chart-utils` helpers
3. Render via `<BaseChart option={option} ... />`
4. Export from `index.ts`

Source chart components from the Dream Light registry: `/Users/mahipat/projects/bluecopa/shadcn-ui-registry/src/components/charts/`

## Toast Notifications

Uses [Sonner](https://sonner.emilkowal.dev/) for toast notifications. The `<Toaster />` component is rendered in `app.tsx`.

### Usage

```tsx
import { toast } from "sonner";

// Success
toast.success("Record saved", { description: "Changes applied." });

// Error
toast.error("Failed to save", { description: "Check your connection." });

// Warning
toast.warning("Unsaved changes");

// Info
toast.info("New data available");

// With action
toast("Item deleted", {
  action: { label: "Undo", onClick: () => undoDelete() },
});

// Promise (loading → success/error)
toast.promise(saveData(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed to save",
});
```

### Toaster Config

The `<Toaster />` component from `~/components/ui/sonner` is pre-configured with Dream Light theme tokens. It renders in the app root (`app.tsx`) and is available globally — no additional setup needed.

## Coding Conventions

### Component Pattern

```tsx
import { cn } from "~/utils/utils";

interface MyComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn("copa:flex copa:items-center copa:gap-2", className)}>
      {children}
    </div>
  );
}
```

### Adding a New Page

1. Create page in `app/pages/my-page.tsx`
2. Add route in `app/routes/index.tsx` inside the `<Route element={<AppLayout />}>` group
3. Add navigation item in `app/components/layouts/app-sidebar.tsx`

### Adding a New UI Component

```bash
# Preferred: Dream Light registry
pnpm dlx shadcn@latest add @bluecopa-ui/component-name

# Fallback: standard shadcn
pnpm dlx shadcn@latest add component-name
```

Components install to `app/components/ui/` with `copa:` prefix pre-configured.

### Icons

Use `lucide-react` or `@tabler/icons-react` (both available).

### State Management

- **Server state**: `@bluecopa/react` hooks (React Query)
- **App context**: `useAppContext()` for user/workspace/settings
- **Local state**: `useState` / `useReducer`
- **No global state library** — keep it simple

### Responsive Design

- Mobile breakpoint: 768px (`useIsMobile()` hook)
- Sidebar: Desktop = collapsible panel, Mobile = sheet overlay
- Use `copa:md:` prefix for desktop-only styles

### Important Gotchas

1. **Prefix order**: `copa:` MUST come before any variant. `copa:hover:bg-accent` not `hover:copa:bg-accent`
2. **`@theme` is build-time**: Cannot reference `.mfe-root` CSS variables in `@theme` blocks. Use `@theme inline` for runtime bindings.
3. **`.mfe-root` not `:root`**: All CSS variables scoped to `.mfe-root` for MFE isolation
4. **Breakpoints with prefix**: Must explicitly define `--breakpoint-*` vars in `@theme` (Tailwind v4 doesn't auto-include them with prefix)
5. **ReactQueryDevtools**: Only rendered in dev mode (`import.meta.env.DEV`)
6. **Config before queries**: `copaSetConfig()` runs synchronously in a `useState` initializer (before any child renders), so the first React Query hook call already has config — no `isConfigured` render gate. It is also re-applied via a `useEffect` when props/env change (e.g. token refresh).
