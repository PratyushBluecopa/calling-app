# TCN dialer setup

This app is a single-page TCN softphone: sign in to TCN, type a number, call. The softphone hook is copied from the cash app (`Cash-APP-Updated-New`); see the "TCN Softphone in Cash App" doc for how it works.

## 1. Backend and TCN (once per environment)

- [ ] The BlueCopa workspace has the api/v1 `/tcn/*` endpoints enabled. They hold the TCN client ID and secret and proxy every TCN call.
- [ ] Add this app's callback URL to the redirect URIs of the TCN OAuth app configured in api/v1:
      `https://<app-origin>/authz/callback`. When mounted inside the BlueCopa shell, the URL includes the host route prefix.
- [ ] Agents have a TCN login with manual-dial rights in a hunt group.
- [ ] Serve the app over HTTPS so the browser allows microphone access.

## 2. Call-log Input Table V2

Create an Input Table V2 in the app's BlueCopa solution. `dial()` inserts one row per call as soon as TCN returns a call id:

| Column | Type | Written by |
| --- | --- | --- |
| `call_sid` | text | dialer |
| `phone_number` | text (E.164, e.g. `+919876543210`) | dialer |
| `customer_id` | text | dialer (empty in dialer-only mode) |
| `customer_name` | text | dialer (empty in dialer-only mode) |
| `user_id` | text | dialer |
| `call_details` | json/text | post-call workflow (optional) |
| `recording_url` | text | post-call workflow (optional) |

If the table or `VITE_BLUECOPA_SOLUTION_ID` is not set, calls still work and nothing is logged.

## 3. Env vars

Set these in `.env` for local dev, or in the host's Settings → Env Vars when deployed:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_BLUECOPA_API_URL` | yes | BlueCopa api/v1 base URL |
| `VITE_BLUECOPA_WORKSPACE_ID` | yes | Workspace id |
| `VITE_BLUECOPA_API_TOKEN` | yes (standalone dev) | BlueCopa access token; the host passes it when mounted |
| `VITE_BLUECOPA_SOLUTION_ID` | for logging | Solution that owns the call-log table |
| `VITE_TABLE_CALL_LOGS` | for logging | Call-log table name |
| `VITE_TCN_WORKFLOW_ID` | optional | Post-call workflow; empty disables it |
| `VITE_TCN_LOOKUP_COLUMN` | optional | TCN report column to match (e.g. `Manual Call ID`) |
| `VITE_TCN_LOOKUP_VALUE` | optional | Fixed lookup value; defaults to the call id |
| `VITE_TCN_DELAY_SECONDS` | optional | Wait before api/v1 reads the report |
| `VITE_TCN_REPORT_TEMPLATE` | optional | TCN report template number (default 2) |
| `VITE_TCN_REPORT_ACCESS_TOKEN` | optional | TCN report service token. Ships to the browser, so prefer moving it to api/v1 |

## 4. Run

```bash
pnpm install
pnpm dev
```

Open the app, click **Connect to TCN**, sign in in the popup, enter a number and click **Call**.

## Known limits (inherited from the cash app hook)

- No token refresh: when the TCN token expires, the next connect falls back to the login popup.
- Call answer and hang-up are detected by polling `keep-alive` every second.
- Inbound calls are shown but not logged.
- Changes from the cash app: E.164 phone numbers in the log, blocked-popup detection, and a sign-out button.
