import { useEffect } from "react";

/**
 * TCN OAuth callback page — rendered inside the popup window.
 * Extracts the auth code from the URL query string, sends it to the
 * opener (main cash-app window) via postMessage, and closes itself.
 */
export default function TcnCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!window.opener) return;

    if (code) {
      window.opener.postMessage({ tcnAuthCode: code }, window.location.origin);
    } else {
      // OAuth error redirect (wrong credentials, denied consent, …)
      const error =
        params.get("error_description") || params.get("error") || "TCN login failed";
      window.opener.postMessage({ tcnAuthError: error }, window.location.origin);
    }
    window.close();
  }, []);

  return (
    <div className="copa:flex copa:h-screen copa:items-center copa:justify-center">
      <p className="copa:text-sm copa:text-muted-foreground">Completing TCN login...</p>
    </div>
  );
}
