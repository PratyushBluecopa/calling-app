import { useState } from "react";
import { Mic, MicOff, Pause, Phone, PhoneOff, Play } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useTcnSoftphone } from "~/hooks/tcn-softphone/use-tcn-softphone";
import { formatPhoneForDisplay, normalizePhone } from "~/utils/phone-utils";

const formatDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function Dialer() {
  const softphone = useTcnSoftphone({ enabled: true });
  const { state } = softphone;
  const [number, setNumber] = useState("");
  const parsed = normalizePhone(number);

  return (
    <div className="copa:flex copa:justify-center copa:p-6">
      {/* Remote call audio from the SIP leg plays here */}
      <audio ref={softphone.audioRef} autoPlay className="copa:hidden" />

      <Card className="copa:w-full copa:max-w-md">
        <CardHeader>
          <CardTitle>Dialer</CardTitle>
          <CardDescription>Place outbound calls through TCN.</CardDescription>
        </CardHeader>

        <CardContent className="copa:grid copa:gap-4">
          {(state.phase === "idle" || state.phase === "error") && (
            <>
              {state.error && (
                <p className="copa:text-sm copa:text-destructive" data-testid="softphone-error">
                  {state.error}
                </p>
              )}
              <Button onClick={softphone.login}>
                {state.phase === "error" ? "Try again" : "Connect to TCN"}
              </Button>
            </>
          )}

          {state.phase === "authenticating" && (
            <p className="copa:text-sm copa:text-muted-foreground">
              Waiting for TCN login in the popup window…
            </p>
          )}

          {state.phase === "connecting" && (
            <p className="copa:text-sm copa:text-muted-foreground">
              {state.connectingMessage || "Connecting…"}
            </p>
          )}

          {state.phase === "ready" && (
            <form
              className="copa:grid copa:gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (parsed.isValid) softphone.dial(parsed.e164);
              }}
            >
              <div className="copa:grid copa:gap-2">
                <Label htmlFor="dial-number">Phone number</Label>
                <Input
                  id="dial-number"
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  autoFocus
                />
                {number.trim() && !parsed.isValid && (
                  <p className="copa:text-xs copa:text-destructive">Enter a valid phone number.</p>
                )}
              </div>
              <Button type="submit" disabled={!parsed.isValid}>
                <Phone />
                {parsed.isValid ? `Call ${formatPhoneForDisplay(number)}` : "Call"}
              </Button>
            </form>
          )}

          {(state.phase === "dialing" || state.phase === "ringing") && (
            <>
              <p className="copa:text-sm">
                {state.phase === "dialing" ? "Dialing" : "Ringing"}{" "}
                {state.currentCall ? formatPhoneForDisplay(state.currentCall.phoneNumber) : ""}…
              </p>
              <Button variant="destructive" onClick={softphone.hangUp}>
                <PhoneOff />
                Cancel
              </Button>
            </>
          )}

          {state.phase === "on-call" && (
            <>
              <div className="copa:text-center">
                <p className="copa:text-sm copa:text-muted-foreground">
                  {state.inboundCaller
                    ? `Inbound: ${state.inboundCaller.name || state.inboundCaller.number}`
                    : state.currentCall
                      ? formatPhoneForDisplay(state.currentCall.phoneNumber)
                      : "On call"}
                </p>
                <p className="copa:text-3xl copa:font-semibold copa:tabular-nums">
                  {formatDuration(state.callDurationSec)}
                </p>
              </div>
              <div className="copa:grid copa:grid-cols-3 copa:gap-2">
                <Button variant="outline" onClick={softphone.toggleMute}>
                  {state.isMuted ? <MicOff /> : <Mic />}
                  {state.isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button variant="outline" onClick={softphone.togglePause}>
                  {state.isPaused ? <Play /> : <Pause />}
                  {state.isPaused ? "Resume" : "Hold"}
                </Button>
                <Button variant="destructive" onClick={softphone.hangUp}>
                  <PhoneOff />
                  End
                </Button>
              </div>
            </>
          )}

          {(state.phase === "ready" || state.phase === "error") && (
            <Button variant="ghost" size="sm" onClick={softphone.disconnect}>
              Sign out of TCN
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
