import { useMemo } from "react";
import { useAppContext } from "~/contexts/app-context";
import type { PermissionsMap } from "~/types";

/**
 * Access the logged-in user's permissions, injected by the host (PRD-3294).
 *
 * The host runs a backend authorization check before mounting this MFE and
 * passes the result as the `permissions` prop — a map of `actionId → permission
 * → granted`. Use the returned `can()` helper to gate UI:
 *
 * ```tsx
 * const { can } = usePermissions();
 * if (can("send_email")) { ... }                 // any permission grants the action
 * if (can("send_email", "write_with_approval")) { ... } // a specific permission
 * ```
 *
 * `permissions` is `{}` when the app has no permission model configured, so
 * `can()` returns `false` by default (fail-closed).
 */
export function usePermissions() {
  const { permissions } = useAppContext();

  return useMemo(() => {
    const can = (actionId: string, permission?: string): boolean => {
      const actionPerms = permissions[actionId];
      if (!actionPerms) return false;
      if (permission) return actionPerms[permission] === true;
      // No specific permission asked → granted if ANY permission is true.
      return Object.values(actionPerms).some(Boolean);
    };

    /** All permissions granted to the user for an action (the `true` keys). */
    const grantedFor = (actionId: string): string[] =>
      Object.entries(permissions[actionId] ?? {})
        .filter(([, granted]) => granted)
        .map(([permission]) => permission);

    return { permissions: permissions as PermissionsMap, can, grantedFor };
  }, [permissions]);
}
