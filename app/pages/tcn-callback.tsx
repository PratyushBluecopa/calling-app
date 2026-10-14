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

    if (code && window.opener) {
      window.opener.postMessage({ tcnAuthCode: code }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div className="copa:flex copa:h-screen copa:items-center copa:justify-center">
      <p className="copa:text-sm copa:text-muted-foreground">Completing TCN login...</p>
    </div>
  );
}
