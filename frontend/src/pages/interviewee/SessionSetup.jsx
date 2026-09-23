import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Video, Mic } from "lucide-react";
import { apiDetail, interviewsApi } from "../../api/vox";
import { useReveal } from "../../lib/motion";
import { stashCameraStream } from "../../lib/cameraBus";

// Pre-interview setup (Zara-style phase 2): environment guidance, real device
// checks (camera preview + mic level), and recording/consent agreement. Only
// then does the candidate proceed into the session.
export default function SessionSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  // state: { interview } for instant sessions | { session } for booked joins
  const interview = state?.interview;
  const bookedSession = state?.session;

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [camState, setCamState] = useState("idle"); // idle | testing | ok | denied | skipped
  const [micState, setMicState] = useState("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const revealRef = useReveal();

  const deviceTestsDone =
    (camState === "ok" || camState === "denied" || camState === "skipped") &&
    (micState === "ok" || micState === "denied" || micState === "skipped");

  async function testCamera() {
    setCamState("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("ok");
    } catch {
      setCamState("denied");
    }
  }

  async function testMic() {
    setMicState("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        requestAnimationFrame(tick);
      };
      tick();
      setMicState("ok");
      // Keep stream open while on this page so the meter stays live.
      streamRef.current = stream;
    } catch {
      setMicState("denied");
    }
  }

  function skipDeviceChecks() {
    if (camState !== "ok") setCamState("skipped");
    if (micState !== "ok") setMicState("skipped");
  }

  // Stop leftover tracks when leaving. After beginSession the camera lives
  // in the hand-off (streamRef nulled), so this only cleans up an abandoned
  // setup (user navigated away without starting) — and mic-test streams.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function beginSession() {
    setStarting(true);
    setError(null);
    try {
      stashCameraStream(streamRef.current);
      streamRef.current = null;
      const applicationId = interview?.application_id || bookedSession?.application_id;
      if (applicationId) {
        const started = await interviewsApi.start(applicationId);
        navigate("/interviewee/session", {
          replace: true,
          state: {
            sessionId: started.interview_id,
            title: interview?.title || bookedSession?.title || started.job_title,
            scheduledFor: bookedSession?.scheduled_for || null,
          },
        });
      } else if (bookedSession?.interview_id) {
        await interviewsApi.startExisting(bookedSession.interview_id);
        navigate("/interviewee/session", {
          replace: true,
          state: {
            sessionId: bookedSession.interview_id,
            title: bookedSession.title,
            scheduledFor: bookedSession.scheduled_for,
          },
        });
      } else {
        navigate("/interviewee/dashboard", { replace: true });
      }
    } catch (err) {
      setError(apiDetail(err) || t("common.error_generic"));
      setStarting(false);
    }
  }

  return (
    <div ref={revealRef} className="max-w-xl mx-auto space-y-6">
      <header data-reveal>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("setup.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {interview?.title || bookedSession?.title || t("setup.generic_title")}
        </p>
      </header>

      {/* Environment checklist */}
      <section data-reveal className="app-card p-5 space-y-2">
        <h2 className="font-semibold text-gray-900">{t("setup.environment_title")}</h2>
        {["quiet", "lighting", "connection", "time"].map((k) => (
          <div key={k} className="flex items-center gap-2 text-sm text-gray-600">
            <Check className="h-4 w-4 text-success shrink-0" />
            {t(`setup.env_${k}`)}
          </div>
        ))}
      </section>

      {/* Device checks */}
      <section data-reveal className="app-card p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">{t("setup.devices_title")}</h2>

        {/* Camera */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Video className="h-4 w-4" /> {t("setup.camera")}
            </div>
            <button
              type="button"
              onClick={testCamera}
              disabled={camState === "ok" || camState === "testing"}
              className="abtn-outline abtn-sm"
            >
              {camState === "ok" ? t("setup.ok") : camState === "testing" ? t("common.loading") : t("setup.test")}
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video max-w-xs shadow-lg">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {camState !== "ok" && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                {camState === "denied" ? t("setup.camera_denied") : t("setup.camera_idle")}
              </div>
            )}
          </div>
        </div>

        {/* Microphone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mic className="h-4 w-4" /> {t("setup.mic")}
            </div>
            <button
              type="button"
              onClick={testMic}
              disabled={micState === "ok" || micState === "testing"}
              className="abtn-outline abtn-sm"
            >
              {micState === "ok" ? t("setup.ok") : micState === "testing" ? t("common.loading") : t("setup.test")}
            </button>
          </div>
          <div className="aprogress max-w-xs">
            <div
              className="aprogress-fill"
              style={{ width: `${micState === "ok" ? micLevel : 0}%` }}
            />
          </div>
          {micState === "denied" && <p className="text-xs text-brand-pink">{t("setup.mic_denied")}</p>}
        </div>

        {(camState === "denied" || micState === "denied" || camState === "idle") && (
          <button type="button" onClick={skipDeviceChecks} className="text-xs text-gray-400 hover:text-gray-600 underline">
            {t("setup.skip")}
          </button>
        )}
      </section>

      {/* Consent */}
      <label data-reveal className="flex items-start gap-3 app-card p-4 cursor-pointer hover:border-brand-blue/30 transition-colors">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand-blue"
        />
        <span className="text-sm text-gray-600">{t("setup.consent")}</span>
      </label>

      {error && <p className="text-brand-pink text-sm">{error}</p>}

      <button
        onClick={beginSession}
        disabled={!deviceTestsDone || !consent || starting}
        className="abtn-primary w-full py-3 disabled:opacity-50"
      >
        {starting ? t("common.loading") : t("setup.begin")}
      </button>

      <p className="text-center">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 underline">
          {t("setup.back")}
        </button>
      </p>
    </div>
  );
}
