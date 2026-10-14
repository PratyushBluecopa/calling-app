import { useCallback } from "react";
import { useTcnFtpManualDialReport } from "@bluecopa/react";
import { useAppContext } from "~/contexts/app-context";

export interface ReportAndTriggerArgs {
  /** The call's task-group sid, taken from the `processManualDial` response
   *  (`scrubbedCall.taskGroupSid`) — sent to the report as `groupSid`. */
  groupSid: string;
  /** The placed call's id — `processManualDial`'s `scrubbedCall.callSid`.
   *  Used for log correlation only; the report is keyed by `groupSid` and the
   *  env lookup value, not the callSid. */
  callSid: string;
}

/**
 * Default TCN saved-report template the backend pulls the Manual Dial Report
 * from when `VITE_TCN_REPORT_TEMPLATE` is unset (template 2). Confirm the real
 * value against the TCN backoffice; override per-deployment via the env var.
 */
const DEFAULT_MANUAL_DIAL_REPORT_TEMPLATE = 2;

/**
 * Post-call hand-off to the backend, via the SDK's `useTcnFtpManualDialReport`
 * (`POST /tcn/ftp-manual-dial-report`).
 *
 * The actual work — pull the TCN FTP Manual Dial Report, parse it, find the
 * row whose `lookupColumn` equals `lookupValue`, and trigger the workflow —
 * happens on **api/v1**. api/v1 triggers the workflow id it is handed, so the
 * frontend forwards:
 *   - the call's task-group sid (`processManualDial` response → `groupSid`),
 *   - the report access token (`VITE_TCN_REPORT_ACCESS_TOKEN` → `tcnToken`),
 *   - the workflow to trigger (`VITE_TCN_WORKFLOW_ID` → `workflowID`),
 *   - the report match column (`VITE_TCN_LOOKUP_COLUMN` → `lookupColumn`),
 *   - who placed the call (`triggerBy`) and the backend trigger `delay`
 *     (`VITE_TCN_DELAY_SECONDS`), and
 *   - the lookup value — `VITE_TCN_LOOKUP_VALUE` when set, else the call's
 *     `callSid` from the `processManualDial` response.
 *
 * Designed to be called fire-and-forget from the softphone on call end: every
 * failure path is swallowed (logged, not thrown) so it never disrupts the
 * agent's return to "ready".
 */
export function useTcnCallReportWorkflow() {
  const { envConfig, user } = useAppContext();
  const { mutateAsync } = useTcnFtpManualDialReport();

  const reportAndTriggerWorkflow = useCallback(
    async ({ groupSid, callSid }: ReportAndTriggerArgs) => {
      const lookupColumn = envConfig.VITE_TCN_LOOKUP_COLUMN;
      const workflowID = envConfig.VITE_TCN_WORKFLOW_ID;
      // The value matched against `lookupColumn` in the report: the env
      // override when set, otherwise the placed call's `callSid` from the
      // `processManualDial` response.
      const lookupValue = envConfig.VITE_TCN_LOOKUP_VALUE || String(callSid);
      // The FTP report call requires a configured service token, not the
      // agent's softphone OAuth token.
      const reportToken = envConfig.VITE_TCN_REPORT_ACCESS_TOKEN;
      // TCN saved-report template number; env override, else the default.
      const templateNumber =
        Number(envConfig.VITE_TCN_REPORT_TEMPLATE) ||
        DEFAULT_MANUAL_DIAL_REPORT_TEMPLATE;
      // Who placed the call (audit/attribution on the triggered process) and
      // how long the backend should wait before triggering (absorbs FTP lag).
      // Config is in seconds; the backend expects milliseconds (e.g. 10 → 10000).
      const triggerBy = user?.email ?? user?.userId ?? "";
      const delaySeconds = Number(envConfig.VITE_TCN_DELAY_SECONDS ?? 0) || 0;
      const delay = delaySeconds * 1000;

      if (!groupSid || !callSid) return;
      if (!reportToken) {
        console.warn(
          "[CallReportWorkflow] skipped — missing report access token",
        );
        return;
      }
      if (!lookupColumn) {
        console.warn("[CallReportWorkflow] skipped — missing lookup column");
        return;
      }
      if (!workflowID) {
        console.warn("[CallReportWorkflow] skipped — missing workflow id");
        return;
      }

      try {
        // Hand everything to api/v1 — it fetches the report, parses it, finds
        // the row where `lookupColumn === lookupValue`, and triggers the
        // workflow `workflowID` (api/v1 requires this id and triggers it).
        await mutateAsync({
          tcnToken: reportToken,
          templateNumber,
          groupSid,
          lookupColumn,
          lookupValue,
          workflowID,
          triggerBy,
          delay,
        });
      } catch (err) {
        console.error(
          `[CallReportWorkflow] match-and-trigger failed for callSid ${callSid}`,
          err,
        );
      }
    },
    [envConfig, user, mutateAsync],
  );

  return { reportAndTriggerWorkflow };
}
