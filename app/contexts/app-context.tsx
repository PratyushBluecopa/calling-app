import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useUser, useGetAllUsers } from "@bluecopa/react";
import type { AppUser, EnvConfig, PermissionsMap, SchemaMap, WorkspaceDataSettings } from "~/types";
import { DEFAULT_WORKSPACE_SETTINGS } from "~/constants";

interface AppContextValue {
  user: AppUser;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  workspaceIds: string[];
  teams: unknown[];
  isAdmin: boolean;
  users: unknown[];
  usersLoading: boolean;
  usersError: Error | null;
  /** Workspace data settings (currency, timezone, date format, fiscal year, number settings, week start day) */
  currentWorkspaceSettings: WorkspaceDataSettings;
  setCurrency: (currency: string) => void;
  /** Merged runtime env config (host `envVars` over build-time `import.meta.env`). */
  envConfig: EnvConfig;
  /** Column-name normalization map injected by the host (workbook `storedSchemaMap`). */
  schemaMap: SchemaMap;
  /** Logged-in user's live permissions injected by the host (actionId → permission → granted). */
  permissions: PermissionsMap;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const fallbackUser = {
  userId: "Not Logged In",
  userExists: false,
  settings: {},
  workspaceIds: [] as string[],
  currentWorkspace: null,
  teams: [] as unknown[],
  userTeamProperties: [] as unknown[],
};

const defaultWorkspaceDataSettings = DEFAULT_WORKSPACE_SETTINGS;

function getWorkspaceDataSettings(workspace: unknown): WorkspaceDataSettings {
  if (!workspace || typeof workspace !== "object") return defaultWorkspaceDataSettings;
  const w = workspace as Record<string, unknown>;
  const customProperties = w.customProperties as Record<string, unknown> | undefined;
  const workspaceSettings = customProperties?.workspaceSettings as Record<string, unknown> | undefined;
  const currencySettings = workspaceSettings?.currencySettings as Record<string, unknown> | undefined;
  const defaultCurrency = currencySettings?.defaultCurrency as { value?: string } | undefined;
  const calendarSettings = workspaceSettings?.calendarSettings as Record<string, unknown> | undefined;
  const numberSettings = workspaceSettings?.numberSettings as Record<string, unknown> | undefined;
  const fiscalYears = w.fiscalYears as Array<{ startMonth?: number; startDate?: number; workspaceDefault?: boolean }> | undefined;
  const defaultFiscal = fiscalYears?.find((fy) => fy.workspaceDefault) ?? fiscalYears?.[0];

  return {
    currency: defaultCurrency?.value ?? defaultWorkspaceDataSettings.currency,
    timezone: (workspaceSettings?.timezone as string) ?? defaultWorkspaceDataSettings.timezone,
    dateFormat: (workspaceSettings?.dateFormat as string) ?? defaultWorkspaceDataSettings.dateFormat,
    fiscalYear: {
      yearType: (calendarSettings?.yearType as string) ?? defaultWorkspaceDataSettings.fiscalYear.yearType,
      startMonth: defaultFiscal?.startMonth,
      startDate: defaultFiscal?.startDate,
    },
    numberSettings: {
      numberSystem: (numberSettings?.numberSystem as string) ?? defaultWorkspaceDataSettings.numberSettings.numberSystem,
      defaultPrecision: (numberSettings?.defaultPrecision as number) ?? defaultWorkspaceDataSettings.numberSettings.defaultPrecision,
      nullPlaceholder: numberSettings?.nullPlaceholder as string | undefined,
    },
    weekStartDay: (w.weekStartDay as string) ?? defaultWorkspaceDataSettings.weekStartDay,
  };
}

export type AppProviderProps = {
  children: ReactNode;
  /** Merged runtime env config. Defaults to build-time `import.meta.env`. */
  envConfig?: EnvConfig;
  /** Host-injected schema map. Defaults to empty. */
  schemaMap?: SchemaMap;
  /** Host-injected permissions for the logged-in user. Defaults to empty. */
  permissions?: PermissionsMap;
};

/** Stable empty fallbacks so the context-value memo isn't invalidated every render. */
const EMPTY_SCHEMA_MAP: SchemaMap = {};
const EMPTY_PERMISSIONS: PermissionsMap = {};

export function AppProvider({ children, envConfig, schemaMap, permissions }: AppProviderProps) {
  const resolvedEnvConfig = (envConfig ??
    (import.meta.env as unknown as EnvConfig)) as EnvConfig;
  const resolvedSchemaMap = schemaMap ?? EMPTY_SCHEMA_MAP;
  const resolvedPermissions = permissions ?? EMPTY_PERMISSIONS;
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);

  const {
    data: apiUsers,
    isLoading: usersLoading,
    error: usersError,
  } = useGetAllUsers({
    enabled: true,
  });

  const { data: user, isLoading, error, refetch } = useUser();

  const userData = error || !user ? fallbackUser : user;
  const userId = (userData as { userId?: string })?.userId ?? null;
  const currentWorkspace =
    (userData as { currentWorkspace?: unknown })?.currentWorkspace ?? null;
  const workspaceIds =
    (userData as { workspaceIds?: string[] })?.workspaceIds ?? [];
  const teams = (userData as { teams?: unknown[] })?.teams ?? [];

  const userRole = useMemo(() => {
    if (!teams || teams.length === 0) return "";
    return teams
      .map((team: unknown) => {
        if (typeof team === "string") return team;
        const t = team as { name?: string; teamName?: string };
        return t?.name ?? t?.teamName ?? "";
      })
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }, [teams]);

  const isAdmin = useMemo(() => {
    if (!teams || teams.length === 0) return false;
    return teams.some((team: unknown) => {
      const t = team as { name?: string; teamName?: string };
      const teamName =
        typeof team === "string" ? team : t?.name ?? t?.teamName ?? "";
      return String(teamName).toLowerCase().includes("admin");
    });
  }, [teams]);

  const usersList = useMemo(() => {
    if (!apiUsers) return [];
    if (Array.isArray(apiUsers)) return apiUsers;
    const obj = apiUsers as Record<string, unknown>;
    if (typeof obj === "object" && "data" in obj) {
      const data = obj.data;
      if (Array.isArray(data)) return data;
    }
    if (typeof obj === "object" && "records" in obj) {
      const records = obj.records;
      if (Array.isArray(records)) return records;
    }
    return [];
  }, [apiUsers]);

  const foundUser = useMemo(
    () =>
      usersList.find(
        (u: unknown) => (u as { id?: string })?.id === userId
      ) as { email?: string; } | undefined,
    [usersList, userId]
  );
  const userEmail = foundUser?.email ?? userId;

  const userWithDetails = useMemo<AppUser>(
    () => ({
      ...(typeof userData === "object" && userData !== null
        ? (userData as Record<string, unknown>)
        : {}),
      email: userEmail ?? "Not Logged In",
      name: userEmail ?? "Not Logged In",
      role: userRole || "",
    }),
    [userData, userEmail, userRole]
  );

  const currentWorkspaceSettings = useMemo<WorkspaceDataSettings>(() => {
    const settings = getWorkspaceDataSettings(currentWorkspace);
    if (currencyOverride) {
      return { ...settings, currency: currencyOverride };
    }
    return settings;
  }, [currentWorkspace, currencyOverride]);

  const value = useMemo<AppContextValue>(
    () => ({
      user: userWithDetails,
      isLoading,
      error: error ?? null,
      refetch: typeof refetch === "function" ? refetch : () => {},
      workspaceIds,
      teams,
      isAdmin,
      users: usersList,
      usersLoading,
      usersError: usersError ?? null,
      currentWorkspaceSettings,
      setCurrency: setCurrencyOverride,
      envConfig: resolvedEnvConfig,
      schemaMap: resolvedSchemaMap,
      permissions: resolvedPermissions,
    }),
    [
      userWithDetails,
      isLoading,
      error,
      refetch,
      userId,
      workspaceIds,
      teams,
      userRole,
      isAdmin,
      usersList,
      usersLoading,
      usersError,
      currentWorkspaceSettings,
      resolvedEnvConfig,
      resolvedSchemaMap,
      resolvedPermissions,
    ]
  );

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
}
