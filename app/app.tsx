import "./app.css";
import { useEffect, useMemo, useState } from "react";
import { reactQuery, ReactQueryDevtools, copaSetConfig } from "@bluecopa/react";
import { Toaster } from "~/components/ui/sonner";
import { AppProvider } from "~/contexts/app-context";
import { ChartProvider } from "~/components/charts";
import { RouteErrorBoundary } from "~/components/error-boundary";
import RouteConfig from "./routes";
import type { EnvConfig, MfeProps } from "~/types";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_SOLUTION_BRANCH,
  DEFAULT_SOLUTION_BRANCH_TYPE,
  DEFAULT_WORKSPACE_ID,
  QUERY_DEFAULTS,
} from "~/constants";
import { initAgGridLicense } from "~/utils/ag-grid-license";

const { QueryClient, QueryClientProvider } = reactQuery;

export default function App(props: MfeProps) {
  // Merge runtime env (host `envVars`) over build-time `import.meta.env`. Host
  // values win so a deployed app can be reconfigured from the Settings → Env
  // Vars panel without a rebuild. Recomputed if the host re-injects `envVars`.
  const envConfig = useMemo<EnvConfig>(
    () =>
      ({ ...import.meta.env, ...(props.envVars ?? {}) }) as unknown as EnvConfig,
    [props.envVars],
  );

  // SDK config: top-level mount props win over env. Solution-context headers
  // (`x-bluecopa-solution-*`) are required by the Input Table V2 SDK and only
  // ever arrive via the host's `envVars`.
  const sdkConfig = useMemo(
    () => ({
      apiBaseUrl:
        props.apiBaseUrl || envConfig.VITE_BLUECOPA_API_URL || DEFAULT_API_BASE_URL,
      accessToken: props.accessToken || envConfig.VITE_BLUECOPA_API_TOKEN || "",
      workspaceId:
        props.workspaceId ||
        envConfig.VITE_BLUECOPA_WORKSPACE_ID ||
        DEFAULT_WORKSPACE_ID,
      userId: props.userId || envConfig.VITE_BLUECOPA_USER_ID || "",
      solutionId: envConfig.VITE_BLUECOPA_SOLUTION_ID || undefined,
      solutionBranch:
        envConfig.VITE_BLUECOPA_SOLUTION_BRANCH || DEFAULT_SOLUTION_BRANCH,
      solutionBranchType:
        envConfig.VITE_BLUECOPA_SOLUTION_BRANCH_TYPE ||
        DEFAULT_SOLUTION_BRANCH_TYPE,
    }),
    [props.apiBaseUrl, props.accessToken, props.workspaceId, props.userId, envConfig],
  );

  // Configure the SDK SYNCHRONOUSLY before any child renders, so hooks that read
  // userId/solutionId from the SDK on their first call (useUser, Input Table V2)
  // see the right values — a useEffect alone would render children once with
  // empty config. This initializer runs exactly once on mount.
  useState(() => {
    copaSetConfig(sdkConfig);
    initAgGridLicense(envConfig.VITE_AG_GRID_LICENSE_KEY);
    return null;
  });

  // Re-apply when the host pushes new props/env after mount (e.g. a refreshed
  // access token or updated solution headers). `copaSetConfig` shallow-merges
  // into a singleton, so re-applying is idempotent.
  useEffect(() => {
    copaSetConfig(sdkConfig);
  }, [sdkConfig]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: QUERY_DEFAULTS.STALE_TIME, retry: QUERY_DEFAULTS.RETRY },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mfe-root copa:min-h-svh copa:animate-in copa:fade-in copa:duration-300">
        <ChartProvider>
          <AppProvider
            envConfig={envConfig}
            schemaMap={props.schemaMap}
            permissions={props.permissions}
          >
            <RouteErrorBoundary>
              <RouteConfig />
            </RouteErrorBoundary>
            <Toaster />
          </AppProvider>
        </ChartProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </div>
    </QueryClientProvider>
  );
}
