import { LicenseManager } from "ag-grid-enterprise";

/**
 * Set the AG Grid Enterprise license key. Pass the key explicitly (e.g. from
 * the host-injected runtime env config) so a deployed MFE can be licensed from
 * the Settings → Env Vars panel. Falls back to the build-time env var for
 * standalone dev.
 */
export function initAgGridLicense(licenseKey?: string) {
  const key = licenseKey || import.meta.env.VITE_AG_GRID_LICENSE_KEY;
  if (!key) {
    console.warn(
      "[AG Grid] No license key found (VITE_AG_GRID_LICENSE_KEY). Enterprise features will show watermarks.",
    );
    return;
  }
  LicenseManager.setLicenseKey(key);
}
