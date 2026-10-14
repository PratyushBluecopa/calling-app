import { useState, useRef, useCallback, useEffect } from "react";
import { UserAgent, Inviter, SessionState } from "sip.js";
import { toast } from "sonner";
import { normalizePhone } from "~/utils/phone-utils";
import { useAppContext } from "~/contexts/app-context";
import { useCallLogInsert } from "~/hooks/tcn-softphone/use-call-log-insert";
import { useTcnCallReportWorkflow } from "~/hooks/tcn-softphone/use-tcn-call-report-workflow";
import {
  useTcnAuthUrl,
  useTcnExchangeCode,
  useTcnCurrentAgent,
  useTcnAgentSkills,
  useTcnCreateSession,
  useTcnHuntGroupSettings,
  useTcnKeepAlive,
  useTcnAgentGetStatus,
  useTcnDialManualPrepare,
  useTcnProcessManualDial,
  useTcnManualDialStart,
  useTcnAgentDisconnect,
  useTcnAgentSetReady,
  useTcnAgentPutCallOnHold,
  useTcnAgentGetCallFromHold,
  useTcnConnectedParty,
  useTcnCallData,
} from "@bluecopa/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoftphonePhase =
  | "idle"
  | "authenticating"
  | "connecting"
  | "ready"
  | "dialing"
  | "ringing"
  | "on-call"
  | "error";

export interface ActiveCall {
  /** Numeric call session id returned by `processManualDial`. */
  callSid: string;
  /** Phone number actually dialed (post-formatting). */
  phoneNumber: string;
  /** Wall-clock when dial fired — useful for cross-checking
   *  durations stored on the call_log row. */
  startedAt: string;
  /** Row id of the call_log entry seeded the moment the manual-dial
   *  API returned. Save in the call-log modal updates this row in
   *  place instead of creating a duplicate. Unset when the seed
   *  insert failed (rare — the call still proceeds). */
  seededCallLogId?: string;
  /** The `processManualDial` response for this call. */
  callResponse?: Record<string, unknown>;
  /** Task-group sid from the `processManualDial` response
   *  (`scrubbedCall.taskGroupSid`). The post-call report→workflow step sends
   *  it to the FTP report as `groupSid`. */
  taskGroupSid?: string;
}

/** Optional caller-side context stamped onto the seeded call_log row. */
export interface DialContext {
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
}

export interface SoftphoneState {
  phase: SoftphonePhase;
  error: string | null;
  isMuted: boolean;
  isPaused: boolean;
  callDurationSec: number;
  connectingStep: number;
  connectingMessage: string;
  inboundCaller: { name: string; number: string } | null;
  /** Set when an outbound call is in flight (dialing → on-call →
   *  hangup). Cleared once the SIP session ends and we return to
   *  `ready`. Read by the call-log modal so the saved row carries
   *  `call_sid` + `phone_number`. */
  currentCall: ActiveCall | null;
}

const CONNECTING_STEPS = [
  "Exchanging auth code...",
  "Getting agent info...",
  "Getting agent skills...",
  "Creating voice session...",
  "Registering SIP connection...",
];

const INITIAL_STATE: SoftphoneState = {
  phase: "idle",
  error: null,
  isMuted: false,
  isPaused: false,
  callDurationSec: 0,
  connectingStep: 0,
  connectingMessage: "",
  inboundCaller: null,
  currentCall: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTcnSoftphone(options: { enabled: boolean }) {
  const [state, setState] = useState<SoftphoneState>(INITIAL_STATE);

  // App context — needed to seed a call_log row the instant the TCN
  // manual-dial API returns a callSid (see `dial()`). `envConfig`
  // resolves the workspace-specific call_logs table name; `user`
  // stamps the row with the agent who placed the call.
  const { envConfig, user } = useAppContext();
  const callLogsTable = envConfig.VITE_TABLE_CALL_LOGS;
  const callLogDirectInsert = useCallLogInsert(callLogsTable);

  // ─── Published @bluecopa/react mutation hooks ───────────────────────────
  const authUrlQuery = useTcnAuthUrl({ enabled: false });
  const exchangeCodeMutation = useTcnExchangeCode();
  const currentAgentMutation = useTcnCurrentAgent();
  const agentSkillsMutation = useTcnAgentSkills();
  const createSessionMutation = useTcnCreateSession();
  const huntGroupSettingsMutation = useTcnHuntGroupSettings();
  const keepAliveMutation = useTcnKeepAlive();
  const agentGetStatusMutation = useTcnAgentGetStatus();
  const dialManualPrepareMutation = useTcnDialManualPrepare();
  const processManualDialMutation = useTcnProcessManualDial();
  const manualDialStartMutation = useTcnManualDialStart();
  const agentDisconnectMutation = useTcnAgentDisconnect();
  const agentSetReadyMutation = useTcnAgentSetReady();
  const putCallOnHoldMutation = useTcnAgentPutCallOnHold();
  const getCallFromHoldMutation = useTcnAgentGetCallFromHold();
  const connectedPartyMutation = useTcnConnectedParty();
  const callDataMutation = useTcnCallData();

  // Post-call side effect: pull the FTP Manual Dial Report, find this call's
  // row by callSid, and fire an HTTP workflow with it. Fire-and-forget on
  // outbound call end — see `fireCallReportWorkflow` below.
  const { reportAndTriggerWorkflow } = useTcnCallReportWorkflow();

  // Persistent refs for mutable connection objects
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const agentSidRef = useRef<string | null>(null);
  const clientSidRef = useRef<string | null>(null);
  const huntGroupSidRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const dialSettingsRef = useRef<Record<string, unknown> | null>(null);
  const userAgentRef = useRef<UserAgent | null>(null);
  const sipSessionRef = useRef<Inviter | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const callInProgressRef = useRef(false);
  const inboundActiveRef = useRef(false);
  const popupRef = useRef<Window | null>(null);
  // Outbound-call bookkeeping for the post-call report→workflow step. Set in
  // `dial()`, read + consumed (set back to null) by `fireCallReportWorkflow`
  // so whichever end path fires first — remote hangup or agent hangUp — runs
  // the workflow exactly once. Stays null for inbound calls.
  const activeCallRef = useRef<ActiveCall | null>(null);
  const dialContextRef = useRef<DialContext | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const setPhase = useCallback(
    (phase: SoftphonePhase, extra?: Partial<SoftphoneState>) => {
      setState((prev) => ({ ...prev, phase, ...extra }));
    },
    [],
  );

  const setConnectingStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      phase: "connecting",
      connectingStep: step,
      connectingMessage: CONNECTING_STEPS[step] || "",
    }));
  }, []);

  // ─── Call Timer ───────────────────────────────────────────────────────────

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setState((prev) => ({ ...prev, callDurationSec: 0 }));
    callTimerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        callDurationSec: prev.callDurationSec + 1,
      }));
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // ─── Post-call report → workflow ────────────────────────────────────────

  /**
   * Fired once when an outbound call ends (remote hangup or agent hangUp).
   * Consumes `activeCallRef` so only the first end-path runs it, then kicks
   * off the FTP-report lookup + workflow trigger as a background task — never
   * awaited, so the agent returns to "ready" immediately. No-op for inbound
   * calls (they never set `activeCallRef`).
   */
  const fireCallReportWorkflow = useCallback(() => {
    const active = activeCallRef.current;
    if (!active) return;
    // Consume-once: clear before the async work so a concurrent end-path
    // (e.g. a keep-alive tick in flight when the agent hangs up) sees null.
    activeCallRef.current = null;
    // The dial context is no longer forwarded (the backend derives correlation
    // itself), but still clear it consume-once alongside the active call.
    dialContextRef.current = null;

    // The report is keyed by the call's task-group sid, captured from the
    // `processManualDial` response at dial time (not the hunt-group sid).
    // `activeCallRef` is already consumed above, so log why we bail — the
    // workflow has no retry path once this returns.
    const groupSid = active.taskGroupSid;
    if (!groupSid) {
      console.warn(
        "[Softphone] skipping post-call report workflow — missing taskGroupSid",
        { callSid: active.callSid },
      );
      return;
    }

    void reportAndTriggerWorkflow({
      groupSid,
      callSid: active.callSid,
    }).catch((err) => {
      console.warn("[Softphone] post-call report workflow failed", err);
    });
  }, [reportAndTriggerWorkflow]);

  // ─── SIP Connection ──────────────────────────────────────────────────────

  const connectSIP = useCallback(
    async (username: string, password: string, dialUrl: string) => {
      const sipTarget = `sip:${dialUrl}@sg-webphone.tcnp3.com`;
      const wsServer = "wss://sg-webphone.tcnp3.com:443/ws";

      const ua = new UserAgent({
        uri: UserAgent.makeURI(`sip:${username}@sg-webphone.tcnp3.com`),
        transportOptions: { server: wsServer },
        authorizationUsername: username,
        authorizationPassword: password,
        sessionDescriptionHandlerFactoryOptions: {
          constraints: { audio: true, video: false },
        },
      });

      await ua.start();
      userAgentRef.current = ua;

      const target = UserAgent.makeURI(sipTarget);
      if (!target) throw new Error("Invalid SIP target URI");

      const inviter = new Inviter(ua, target);

      inviter.stateChange.addListener((newState: SessionState) => {
        if (newState === SessionState.Established) {
          const sdh = inviter.sessionDescriptionHandler as
            | { peerConnection?: RTCPeerConnection }
            | undefined;
          const pc = sdh?.peerConnection;
          if (pc && audioRef.current) {
            const stream = new MediaStream();
            pc.getReceivers().forEach((r) => {
              if (r.track) stream.addTrack(r.track);
            });
            audioRef.current.srcObject = stream;
          }
        }
        if (newState === SessionState.Terminated) {
          stopKeepAlive();
        }
      });

      await inviter.invite();
      sipSessionRef.current = inviter;
    },
    [],
  );

  // ─── Keep Alive ───────────────────────────────────────────────────────────

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Slow heartbeat (30s) — keeps TCN session alive when idle, detects inbound calls
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(async () => {
      try {
        const token = accessTokenRef.current;
        const sessionSid = sessionIdRef.current;
        if (!token || !sessionSid) return;

        const data = await keepAliveMutation.mutateAsync({ token, sessionSid });
        const { statusDesc } = data;

        // Inbound call detection
        if (
          statusDesc === "PEERED" &&
          lastStatusRef.current !== "PEERED" &&
          !callInProgressRef.current &&
          !inboundActiveRef.current
        ) {
          await handleInboundCall();
        }

        lastStatusRef.current = statusDesc;
      } catch {
        // heartbeat failures are non-fatal
      }
    }, 30000);
  }, [keepAliveMutation, stopHeartbeat]);

  // Fast poller (1s) — monitors call state during ringing/on-call
  const startKeepAlive = useCallback(() => {
    stopKeepAlive();
    keepAliveRef.current = setInterval(async () => {
      try {
        const token = accessTokenRef.current;
        const sessionSid = sessionIdRef.current;
        if (!token || !sessionSid) return;

        const data = await keepAliveMutation.mutateAsync({ token, sessionSid });
        const { status, statusDesc } = data;

        // Outbound call answered — transition from ringing to on-call
        if (
          callInProgressRef.current &&
          statusDesc === "PEERED" &&
          lastStatusRef.current !== "PEERED"
        ) {
          startCallTimer();
          setPhase("on-call");
        }

        // Outbound call ended by remote
        if (callInProgressRef.current && status === "5") {
          callInProgressRef.current = false;
          stopCallTimer();
          stopKeepAlive();
          startHeartbeat();
          // Kick off the FTP report → workflow before clearing currentCall —
          // it reads the callSid from `activeCallRef`, which it consumes.
          fireCallReportWorkflow();
          setPhase("ready", { isMuted: false, currentCall: null });
          try {
            await agentSetReadyMutation.mutateAsync({ token, sessionSid });
          } catch {
            // ignore
          }
        }

        // Inbound call ended by remote
        if (inboundActiveRef.current && status === "5") {
          inboundActiveRef.current = false;
          stopCallTimer();
          stopKeepAlive();
          startHeartbeat();
          setPhase("ready", {
            isMuted: false,
            inboundCaller: null,
            currentCall: null,
          });
          try {
            await agentSetReadyMutation.mutateAsync({ token, sessionSid });
          } catch {
            // ignore
          }
        }

        lastStatusRef.current = statusDesc;
      } catch {
        // keep-alive failures are non-fatal
      }
    }, 1000);
  }, [
    keepAliveMutation,
    agentSetReadyMutation,
    setPhase,
    stopCallTimer,
    startCallTimer,
    stopKeepAlive,
    startHeartbeat,
    fireCallReportWorkflow,
  ]);

  // ─── Inbound Call ─────────────────────────────────────────────────────────

  const handleInboundCall = useCallback(async () => {
    try {
      const token = accessTokenRef.current;
      const sessionSid = sessionIdRef.current;
      if (!token || !sessionSid) return;

      const party = await connectedPartyMutation.mutateAsync({
        token,
        sessionSid,
      });
      if (party.callType !== "INBOUND") return;

      inboundActiveRef.current = true;
      let callerName = "Unknown Caller";
      let phoneNumber = "";

      try {
        const callResult = await callDataMutation.mutateAsync({
          token,
          callSid: Number(party.callId),
        });
        callerName =
          callResult.callerIdName ||
          callResult.journeyRetrievedData?.FName ||
          "Unknown Caller";
        phoneNumber = callResult.journeyRetrievedData?.PhoneNumber || "";
      } catch {
        // proceed with defaults
      }

      startCallTimer();
      setPhase("on-call", {
        inboundCaller: { name: callerName, number: phoneNumber },
      });
    } catch {
      inboundActiveRef.current = false;
    }
  }, [connectedPartyMutation, callDataMutation, setPhase, startCallTimer]);

  // ─── Login Flow ───────────────────────────────────────────────────────────

  // localStorage keys for the access / refresh tokens. Tokens persist
  // across page reloads so the user only goes through the OAuth popup
  // once per device — subsequent loads jump straight to the agent /
  // session bootstrap. Cleared on `disconnect()` and on any 401-style
  // failure during the agent setup steps below.
  const TCN_TOKEN_KEY = "bluecopa.tcn.accessToken";
  const TCN_REFRESH_KEY = "bluecopa.tcn.refreshToken";

  const persistTokens = useCallback(
    (access: string | null, refresh: string | null) => {
      try {
        if (access) localStorage.setItem(TCN_TOKEN_KEY, access);
        else localStorage.removeItem(TCN_TOKEN_KEY);
        if (refresh) localStorage.setItem(TCN_REFRESH_KEY, refresh);
        else localStorage.removeItem(TCN_REFRESH_KEY);
      } catch {
        // Storage may be disabled (Safari private mode etc.); the
        // refs above still hold the in-memory copy for this session.
      }
    },
    [],
  );

  /**
   * Bootstrap from a token already in `accessTokenRef`. Runs every
   * step of `runLoginFlow` after the code → token exchange, so a
   * stored token from a prior session goes straight to agent setup.
   */
  const runAgentBootstrap = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) throw new Error("No access token");

    setConnectingStep(1);
    const agent = await currentAgentMutation.mutateAsync({ token });
    agentSidRef.current = agent.agentSid;
    clientSidRef.current = agent.clientSid;
    huntGroupSidRef.current = agent.huntGroupSid;

    setConnectingStep(2);
    const skillsData = await agentSkillsMutation.mutateAsync({
      token,
      huntGroupSid: agent.huntGroupSid,
    });

    setConnectingStep(3);
    const session = await createSessionMutation.mutateAsync({
      token,
      huntGroupSid: agent.huntGroupSid,
      skills: skillsData.skills || {},
    });
    sessionIdRef.current = String(session.voiceSessionSid);

    const settings = await huntGroupSettingsMutation.mutateAsync({
      token,
      huntGroupSid: agent.huntGroupSid,
    });
    dialSettingsRef.current = settings.manualDial as Record<string, unknown>;

    setConnectingStep(4);
    const { username, password, dialUrl } = session.voiceRegistration;
    await connectSIP(username, password, dialUrl);

    startHeartbeat();
    setPhase("ready");
  }, [
    currentAgentMutation,
    agentSkillsMutation,
    createSessionMutation,
    huntGroupSettingsMutation,
    connectSIP,
    startHeartbeat,
    setPhase,
    setConnectingStep,
  ]);

  const runLoginFlow = useCallback(
    async (code: string) => {
      try {
        setConnectingStep(0);
        const tokenData = await exchangeCodeMutation.mutateAsync({ code });
        accessTokenRef.current = tokenData.access_token;
        refreshTokenRef.current = tokenData.refresh_token;
        await runAgentBootstrap();
        // Persist only after the full bootstrap succeeds, so a failed
        // login never leaves a token behind in storage.
        persistTokens(tokenData.access_token, tokenData.refresh_token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        // A failed bootstrap with a stored token usually means the
        // token was rejected — drop it so the next login attempt
        // takes the OAuth path.
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        persistTokens(null, null);
        setPhase("error", { error: msg });
      }
    },
    [
      exchangeCodeMutation,
      runAgentBootstrap,
      persistTokens,
      setPhase,
      setConnectingStep,
    ],
  );

  // ─── OAuth Popup Listener ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.tcnAuthCode) {
        popupRef.current?.close();
        runLoginFlow(event.data.tcnAuthCode);
      } else if (event.data?.tcnAuthError) {
        popupRef.current?.close();
        setPhase("error", { error: String(event.data.tcnAuthError) });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [runLoginFlow, setPhase]);

  // ─── Public Actions ───────────────────────────────────────────────────────

  const login = useCallback(async () => {
    // If we've got a stored access token from a prior session, run
    // straight into agent / session bootstrap. Failure inside
    // `runAgentBootstrap` falls back to the OAuth popup flow below
    // (the catch in `runLoginFlow` clears the rejected token, so the
    // next click can re-fetch a fresh code).
    try {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(TCN_TOKEN_KEY);
      } catch {
        // localStorage unavailable — fall through to OAuth.
      }
      if (stored) {
        accessTokenRef.current = stored;
        try {
          refreshTokenRef.current = localStorage.getItem(TCN_REFRESH_KEY);
        } catch {
          /* ignore */
        }
        setPhase("connecting");
        try {
          await runAgentBootstrap();
          return;
        } catch (bootstrapErr) {
          // Stored token rejected — wipe and continue into the
          // OAuth popup path so the user can re-authenticate.
          accessTokenRef.current = null;
          refreshTokenRef.current = null;
          persistTokens(null, null);
          console.warn(
            "[Softphone] stored TCN token rejected; falling back to OAuth",
            bootstrapErr,
          );
        }
      }

      setPhase("authenticating");
      const result = await authUrlQuery.refetch();
      if (result.error) {
        const errObj = result.error as any;
        throw new Error(
          errObj?.message || errObj?.toString() || "Auth URL query failed",
        );
      }
      const url = result.data?.url;
      if (!url) throw new Error("Failed to get auth URL — no url in response");
      popupRef.current = window.open(
        url,
        "_blank",
        "width=500,height=600,scrollbars=yes",
      );
      if (!popupRef.current) {
        throw new Error("The TCN login popup was blocked. Allow popups for this site and try again.");
      }
      // If the user closes the popup (e.g. after a failed login) without a
      // code ever arriving, leave "authenticating" instead of spinning forever.
      const popup = popupRef.current;
      const closedPoll = setInterval(() => {
        if (!popup.closed) return;
        clearInterval(closedPoll);
        setState((prev) =>
          prev.phase === "authenticating"
            ? { ...prev, phase: "error", error: "TCN login was not completed. Please try again." }
            : prev,
        );
      }, 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Softphone] Login error:", err);
      setPhase("error", { error: msg });
    }
  }, [authUrlQuery, setPhase, runAgentBootstrap, persistTokens]);

  const dial = useCallback(
    async (phoneNumber: string, context?: DialContext) => {
      const token = accessTokenRef.current;
      const sessionSid = sessionIdRef.current;
      if (!token || !sessionSid) return;

      // Normalize the input before handing it to TCN. Whatever shape the
      // caller passed in — `+91 98765 43210`, `09876543210`, an Excel
      // paste with a leading apostrophe — we strip every prefix down to
      // the national-significant-number and hand TCN exactly the digits
      // a human would press on a keypad. The country code travels in a
      // separate field (`callerIdCountryCode` / `countryCode`); stamping
      // it onto `phoneNumber` too was routing calls to the wrong party
      // because TCN double-prefixed and dialed a different subscriber.
      const parsed = normalizePhone(phoneNumber);
      if (!parsed.isValid) {
        toast.error("Invalid phone number — can't place the call.");
        return;
      }
      const dialDigits = parsed.national;
      // Surface the exact digits we're handing to TCN so support can
      // cross-check "we dialed the right number" against the recording
      // when a caller reports being connected to the wrong party.
      try {
        setPhase("dialing");

        // If paused, set ready first
        if (state.isPaused) {
          await agentSetReadyMutation.mutateAsync({ token, sessionSid });
          setState((prev) => ({ ...prev, isPaused: false }));
        }

        const statusData = await agentGetStatusMutation.mutateAsync({ token });
        sessionIdRef.current = String(statusData.currentSessionId);
        const sid = sessionIdRef.current;

        await dialManualPrepareMutation.mutateAsync({ token, sessionSid: sid });

        const ds = dialSettingsRef.current || {};
        const processData = await processManualDialMutation.mutateAsync({
          token,
          call: {
            agentSid: agentSidRef.current,
            callerId: (ds as Record<string, string>).defaultCallerId || "",
            clientSid: clientSidRef.current,
            doRecord: String(
              (ds as Record<string, boolean>).callRecording || false,
            ),
            phoneNumber: dialDigits,
            callerIdCountryCode: parsed.countryCode,
            countryCode: parsed.countryCode,
            countrySid: String(
              (ds as Record<string, number>).defaultCountrySid || 10,
            ),
            doDnclScrub: "true",
            callDataType: "Manual",
            doCellPhoneScrub: String(
              (ds as Record<string, boolean>).scrubCellPhones || false,
            ),
            callerIdCountrySid: String(
              (ds as Record<string, number>).defaultCountrySid || 10,
            ),
          },
        });

        const sc = processData.scrubbedCall;

        await manualDialStartMutation.mutateAsync({
          token,
          agentSessionSid: sid,
          huntGroupSid: huntGroupSidRef.current!,
          simpleCallData: {
            callSid: sc.callSid,
            agentSid: agentSidRef.current,
            taskGroupSid: sc.taskGroupSid,
            callerId: sc.callerId,
            clientSid: clientSidRef.current,
            doRecord: sc.doRecord,
            phoneNumber: dialDigits,
            callerIdCountryCode: sc.callerIdCountryCode || parsed.countryCode,
            countryCode: sc.countryCode || parsed.countryCode,
            callDataType: "Manual",
            callerIdCountrySid: sc.callerIdCountrySid || 10,
            countrySid: sc.countrySid || 10,
          },
        });

        callInProgressRef.current = true;
        stopHeartbeat();
        startKeepAlive();

        // Seed a call_log row the instant the manual-dial API returns a
        // callSid — no need to wait for SIP `Established`. Every dial
        // gets a row regardless of whether the agent ever opens the
        // notes tab, and the Save handler updates this row in place via
        // `seededCallLogId`. Failures here are swallowed: the dial still
        // proceeds, the agent can fall back to the manual-log path.
        let seededCallLogId: string | undefined;
        try {
          const inserted = await callLogDirectInsert.insert({
            call_sid: String(sc.callSid),
            phone_number: parsed.e164,
            customer_id: context?.customerId ?? "",
            customer_name: context?.customerName ?? "",
            user_id: String(
              (user as { userId?: string; id?: string } | null)?.userId ??
                (user as { id?: string } | null)?.id ??
                "",
            ),
          });
          const newId = (
            (
              inserted as {
                id?: unknown;
                _copa_id?: unknown;
                copa_id?: unknown;
              } | null
            )?.id ??
            (inserted as { _copa_id?: unknown } | null)?._copa_id ??
            (inserted as { copa_id?: unknown } | null)?.copa_id ??
            ""
          ).toString();
          if (newId) seededCallLogId = newId;
        } catch (err) {
          console.warn("[Softphone] failed to seed call_log row", err);
        }

        const activeCall: ActiveCall = {
          callSid: String(sc.callSid),
          phoneNumber: dialDigits,
          startedAt: new Date().toISOString(),
          seededCallLogId,
          callResponse: processData as Record<string, unknown>,
          taskGroupSid: sc.taskGroupSid,
        };
        // Stash the call + dial context so the post-call report→workflow step
        // can find this call in the FTP report by callSid once it ends.
        activeCallRef.current = activeCall;
        dialContextRef.current = context ?? null;

        setPhase("ringing", { currentCall: activeCall });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Call failed";
        setPhase("error", { error: msg });
      }
    },
    [
      callLogDirectInsert,
      user,
      agentSetReadyMutation,
      agentGetStatusMutation,
      dialManualPrepareMutation,
      processManualDialMutation,
      manualDialStartMutation,
      state.isPaused,
      setPhase,
      startCallTimer,
      stopHeartbeat,
      startKeepAlive,
    ],
  );

  const hangUp = useCallback(async () => {
    const token = accessTokenRef.current;
    const sessionSid = sessionIdRef.current;
    if (!token || !sessionSid) return;

    try {
      await agentDisconnectMutation.mutateAsync({ token, sessionSid });
      callInProgressRef.current = false;
      inboundActiveRef.current = false;
      stopCallTimer();
      stopKeepAlive();
      startHeartbeat();
      // Agent-initiated end of an outbound call — run the report→workflow
      // step (no-op for inbound, where `activeCallRef` was never set).
      fireCallReportWorkflow();
      setPhase("ready", {
        isMuted: false,
        inboundCaller: null,
        currentCall: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to end call";
      setPhase("error", { error: msg });
    }
  }, [
    agentDisconnectMutation,
    setPhase,
    stopCallTimer,
    stopKeepAlive,
    startHeartbeat,
    fireCallReportWorkflow,
  ]);

  const toggleMute = useCallback(() => {
    const sdh = sipSessionRef.current?.sessionDescriptionHandler as
      | { peerConnection?: RTCPeerConnection }
      | undefined;
    const pc = sdh?.peerConnection;
    if (!pc) {
      setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
      return;
    }

    const senders = pc.getSenders().filter((s) => s.track?.kind === "audio");
    setState((prev) => {
      const newMuted = !prev.isMuted;
      senders.forEach((s) => {
        if (s.track) s.track.enabled = !newMuted;
      });
      return { ...prev, isMuted: newMuted };
    });
  }, []);

  const togglePause = useCallback(async () => {
    const token = accessTokenRef.current;
    const sessionSid = sessionIdRef.current;
    if (!token || !sessionSid) return;

    try {
      if (!state.isPaused) {
        await putCallOnHoldMutation.mutateAsync({ token, sessionSid });
        setState((prev) => ({ ...prev, isPaused: true }));
      } else {
        await getCallFromHoldMutation.mutateAsync({ token, sessionSid });
        setState((prev) => ({ ...prev, isPaused: false }));
      }
    } catch (err) {
      // hold/unhold error — non-fatal
    }
  }, [putCallOnHoldMutation, getCallFromHoldMutation, state.isPaused]);

  const disconnect = useCallback(async () => {
    stopKeepAlive();
    stopHeartbeat();
    stopCallTimer();

    if (sipSessionRef.current) {
      try {
        await sipSessionRef.current.bye();
      } catch {
        // ignore
      }
    }
    if (userAgentRef.current) {
      try {
        await userAgentRef.current.stop();
      } catch {
        // ignore
      }
    }

    // Clear all refs + the stored tokens — a deliberate sign-out
    // should send the user through the OAuth popup again next time.
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    persistTokens(null, null);
    agentSidRef.current = null;
    clientSidRef.current = null;
    huntGroupSidRef.current = null;
    sessionIdRef.current = null;
    dialSettingsRef.current = null;
    userAgentRef.current = null;
    sipSessionRef.current = null;
    callInProgressRef.current = false;
    inboundActiveRef.current = false;
    lastStatusRef.current = null;
    activeCallRef.current = null;
    dialContextRef.current = null;

    setState(INITIAL_STATE);
  }, [stopKeepAlive, stopHeartbeat, stopCallTimer, persistTokens]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopKeepAlive();
      stopHeartbeat();
      stopCallTimer();
      if (sipSessionRef.current) {
        try {
          sipSessionRef.current.bye();
        } catch {
          // ignore
        }
      }
      if (userAgentRef.current) {
        try {
          userAgentRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [stopKeepAlive, stopHeartbeat, stopCallTimer]);

  return {
    state,
    login,
    dial,
    hangUp,
    toggleMute,
    togglePause,
    disconnect,
    audioRef,
  };
}
