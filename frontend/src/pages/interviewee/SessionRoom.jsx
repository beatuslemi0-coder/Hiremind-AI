import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Mic, MicOff, SendHorizonal, Video, Volume2, VolumeX } from "lucide-react";
import client from "../../api/client";
import { interviewsApi } from "../../api/vox";
import { takeCameraStream, stashCameraStream } from "../../lib/cameraBus";
import interviewerPortrait from "../../assets/interviewer.png";

/**
 * Live interview session — Zara-style visual room, FULL VIEWPORT.
 *
 * This page owns the entire screen: no dashboard shell, no wizard header, no
 * page chrome. A slim room topbar (title + status + voice toggle + exit) sits
 * above the stage; on desktop the interview (avatar + camera + composer) sits
 * LEFT and the live transcript RIGHT, stacking on mobile.
 *
 * The interview is CONVERSATIONAL, not turn-based dialogue:
 *  - The avatar speaks each question aloud; its mouth is driven by the
 *    utterance's word-boundary events, so lips track the actual audio.
 *  - The candidate's mic is ALWAYS ON (open conversation) once the session
 *    starts — speech recognition restarts itself automatically, interim
 *    words stream into the composer, and a short silence (1.6s) after
 *    meaningful speech auto-sends the answer. The mic button mutes/unmutes;
 *    typing + Enter still works alongside it.
 *
 * Everything remains on-device: no recording is uploaded, the transcript is
 * text only. State stays server-authoritative (question plan + index in the
 * session row), so a refresh reattaches to the same conversation.
 */

/* The interviewer is a real photograph filling the stage. A photo's mouth
   can't flex, so "lip-sync" becomes presence motion: the same word
   boundaries that drove the old SVG mouth now drive a gentle talking zoom
   + micro-nod, synchronized with the audio so the portrait visibly speaks
   in rhythm and settles still the moment the voice stops. */
function InterviewerPortrait({ state, energy = 0 }) {
  const talking = state === "talking";
  // energy 0..1 → talking scale 1.012..1.020 plus a tiny nod; idle adds a
  // slow CSS breathing drift so the photo never reads as a static poster.
  const scale = talking ? 1.012 + energy * 0.008 : 1;
  const nod = talking ? energy * 3 : 0;
  return (
    <div
      className={`room-portrait ${talking ? "room-portrait--talking" : ""}`}
      style={{
        transform: `scale(${scale.toFixed(4)}) translateY(${nod.toFixed(2)}px)`,
      }}
      aria-hidden="true"
    >
      {/* Two layers, video-call style: the sharp copy shows EVERY pixel of
          the photo (contain, nothing cropped); a blurred enlarged copy of
          the same photo fills the leftover space — no bars, no cut. */}
      <img
        src={interviewerPortrait}
        alt=""
        className="room-portrait-bg"
        draggable="false"
      />
      <img src={interviewerPortrait} alt="" draggable="false" className="room-portrait-photo" />
    </div>
  );
}

 function RoomPortal({ children }) {
    return createPortal(children, document.body);
  }

export default function SessionRoom() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const initialSessionId = state?.sessionId;

  const [sessionId, setSessionId] = useState(initialSessionId ?? null);
  const [title, setTitle] = useState(state?.title ?? t("sessionRoom.generic_title"));
  const [scheduledFor] = useState(state?.scheduledFor ?? null);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [planSize, setPlanSize] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // --- visual room state ---
  const [avatarState, setAvatarState] = useState("listening"); // talking | listening | idle
  const [mouth, setMouth] = useState(0); // 0..1 speech energy while talking
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voiceOn, setVoiceOn] = useState(false); // avatar's voice; auto-enabled if supported
  const voiceEnabled = ttsSupported;
  const lastSpokenRef = useRef(null);

  // --- conversational mic state ---
  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const [micOn, setMicOn] = useState(true); // user's choice; default open
  const micOnRef = useRef(true);
  micOnRef.current = micOn;
  const [listening, setListening] = useState(false); // engine actively capturing
  const [voiceInputBroken, setVoiceInputBroken] = useState(false);
  const recogRef = useRef(null);
  const recogWantRef = useRef(false); // should the engine be running?
  const finalBufRef = useRef(""); // finalized speech since last send
  const silenceTimerRef = useRef(null);
  const speakingRef = useRef(false); // avatar is talking → don't capture

  const [cameraState, setCameraState] = useState("starting"); // starting | on | denied
  const [cameraNonce, setCameraNonce] = useState(0); // bump to retry acquisition
  const streamRef = useRef(null);

  /* Attach the persistent stream to a self-view node SYNCHRONOUSLY during
     commit (ref callbacks run before the browser paints). This is the
     anti-blink guarantee: even if React recreates the <video> node on a
     re-render, the replacement is born with the stream already bound — it
     never shows a blank frame, unlike a post-paint effect re-attach. */
  const attachSelfView = useCallback((el) => {
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  const answeredCount = useMemo(
    () => Math.min(questionIndex, Math.max(0, planSize - 1)),
    [questionIndex, planSize]
  );
  const totalQuestions = useMemo(() => Math.max(0, planSize - 1), [planSize]);

  const transcriptRef = useRef(null);
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [messages]);

  // --- boot: resolve the real FastAPI interview + first question ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Hii ni response halisi kutoka POST /interviews/start.
        // Tukipata data hii, hatupigi tena endpoint ya zamani ya
        // /interviewee/interview-sessions/{id}/begin.
        const startedInterview = state?.startedInterview;

        if (startedInterview?.interview_id) {
          if (cancelled) return;

          setSessionId(startedInterview.interview_id);
          setTitle(
            state?.title ||
            startedInterview.job_title ||
            t("sessionRoom.generic_title")
          );

          // Backend imetengeneza swali la kwanza tayari.
          setMessages([
            {
              id: startedInterview.question_id,
              role: "ai",
              content: startedInterview.question,
            },
          ]);

          // Kwa sasa plan size haijarudishwi na /interviews/start,
          // hivyo tunaacha progress counter bila kuonyesha idadi ya kubuni.
          setQuestionIndex(0);
          setPlanSize(0);
          setCompleted(false);
          setLang("sw");
          setBooting(false);
          return;
        }

        // Fallback kwa booked sessions/flow ya zamani.
        let id = initialSessionId;
        let sessionTitle = state?.title ?? null;
        if (!id) {
          const { data } = await client.get("/interviewee/interview-sessions/active");
          id = data.session.id;
          if (data.session.title) sessionTitle = data.session.title;
        }
        if (cancelled) return;
        setSessionId(id);
        if (sessionTitle) setTitle(sessionTitle);

        const { data } = await client.post(`/interviewee/interview-sessions/${id}/begin`);
        if (cancelled) return;
        setMessages(data.messages);
        setQuestionIndex(data.questionIndex);
        setPlanSize(data.planSize);
        setCompleted(data.status !== "inaendelea");
        if (data.lang) setLang(data.lang);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          navigate("/interviewee/dashboard", { replace: true });
          return;
        }
        setError(t("sessionRoom.load_error"));
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- camera self-view ---
  // Acquisition order: (1) the stream stashed by SessionSetup — no new
  // getUserMedia call, so no permission prompt and no device-release race;
  // (2) a fresh getUserMedia with backoff retries; (3) a manual retry button.
  // The stream lives in a ref (not state), so React re-renders never touch
  // it; a small effect re-attaches it to whatever <video> node is mounted.
  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;
    let healthTimer = null;
    let attempts = 0;

    function startHealthPolling() {
      // The `ended` event deliberately does NOT fire for a local stop() (spec:
      // external termination only), so poll readyState instead — this catches
      // an external device grab or anything else that kills the track.
      healthTimer = setInterval(() => {
        const track = streamRef.current?.getVideoTracks()[0];
        if (!track || track.readyState !== "live") {
          streamRef.current = null;
          setCameraNonce((n) => n + 1);
        }
      }, 1500);
    }

    function wireup(stream) {
      streamRef.current = stream;
      attachSelfView(document.querySelector("[data-selfview]"));
      setCameraState("on");
      startHealthPolling();
    }

    async function acquire() {
      attempts += 1;
      // StrictMode dev double-mount guard: if a healthy stream is already
      // bound (first effect run won the race), reuse it instead of asking
      // the device twice — a second getUserMedia here is what flickers.
      if (streamRef.current?.getVideoTracks()[0]?.readyState === "live") {
        attachSelfView(document.querySelector("[data-selfview]"));
        setCameraState("on");
        startHealthPolling();
        return;
      }
      const stashed = takeCameraStream();
      if (stashed && stashed.getVideoTracks()[0]?.readyState === "live") {
        if (cancelled) {
          stashed.getTracks().forEach((tr) => tr.stop());
          return;
        }
        wireup(stashed);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        wireup(stream);
      } catch {
        if (cancelled) return;
        if (attempts < 3) {
          retryTimer = setTimeout(acquire, 900 * attempts);
        } else {
          setCameraState("denied");
        }
      }
    }

    setCameraState("starting");
    acquire();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearInterval(healthTimer);
    };
  }, [cameraNonce]);

  // (The ref callback above replaces the old every-commit re-attach effect:
  // it does the same job pre-paint, so a recreated node can never flash.)

  // Room teardown: keep a healthy stream for the next visit (exit → "Keep it
  // running" → resume without a second permission prompt); stop a dead one.
  useEffect(() => {
    return () => {
      const stream = streamRef.current;
      if (stream && stream.getVideoTracks().some((tr) => tr.readyState === "live")) {
        stashCameraStream(stream);
      } else {
        stream?.getTracks().forEach((tr) => tr.stop());
      }
      window.speechSynthesis?.cancel();
      recogWantRef.current = false;
      recogRef.current?.abort?.();
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // --- avatar voice with TRUE lip-sync -----------------------------------
  // Each utterance reports word boundaries (Chrome/Edge); we convert them
  // into "energy" pulses for the portrait (talking zoom + nod). A fallback
  // pulse runs when boundaries aren't supported, so the portrait still
  // visibly speaks in rhythm on Safari/Firefox.
  const mouthTimerRef = useRef(null);

  useEffect(() => {
    if (!ttsSupported) return;
    setVoiceOn(true);
  }, [ttsSupported]);

  function stopMouth() {
    clearInterval(mouthTimerRef.current);
    mouthTimerRef.current = null;
    setMouth(0);
  }

  useEffect(() => {
    if (!ttsSupported || !voiceOn || completed) return;
    const lastAi = [...messages].reverse().find((m) => m.role === "ai");
    if (!lastAi || lastSpokenRef.current === lastAi.id) return;
    lastSpokenRef.current = lastAi.id;

    const synth = window.speechSynthesis;
    synth.cancel();
    stopMouth();
    const utter = new SpeechSynthesisUtterance(lastAi.content);
    const target = lang === "sw" ? "sw" : "en";
    // The interviewer is a woman (see her portrait) — so she must SOUND like
    // one. Voices load asynchronously on some browsers, so fall back to any
    // English voice rather than leaving the platform default (often male).
    const voices = synth.getVoices();
    const femaleHints = /female|woman|zira|samantha|victoria|karen|moira|tessa|fiona|serena|allison|ava|susan|catherine|joanna|libby|sonia|aria|jenny|emma|michelle|elsa|maria|paulina|milena|zosia|sabina/i;
    const maleHints = /male|david|mark|james|richard|george|daniel|fred|alex|rishi|tom|oliver|ryan|guy|christopher|eric|brian|liam|noah|william/i;
    const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
    const match =
      (target === "en" && (english.find((v) => femaleHints.test(v.name)) || english.find((v) => !maleHints.test(v.name)))) ||
      voices.find((v) => femaleHints.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(target)) ||
      english[0] ||
      null;
    if (match) utter.voice = match;
    utter.lang = match?.lang || (lang === "sw" ? "sw-KE" : "en-US");
    utter.pitch = 1.12; // a touch brighter, matching the portrait
    utter.rate = 0.98;

    let boundarySeen = false;
    utter.onstart = () => {
      setAvatarState("talking");
      speakingRef.current = true;
      // Fallback speech energy when boundary events are unavailable.
      clearInterval(mouthTimerRef.current);
      mouthTimerRef.current = setInterval(() => {
        if (boundarySeen) return; // boundaries drive the energy instead
        setMouth((m) => (m <= 0.15 ? 0.85 : m - 0.28));
      }, 140);
    };
    utter.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      boundarySeen = true;
      if (e.charLength) {
        setMouth(visemeFor(e.charLength));
      } else {
        setMouth(0.8);
      }
    };
    utter.onend = () => {
      speakingRef.current = false;
      stopMouth();
      setAvatarState(completed ? "idle" : "listening");
    };
    utter.onerror = () => {
      speakingRef.current = false;
      stopMouth();
      setAvatarState(completed ? "idle" : "listening");
    };
    synth.speak(utter);
  }, [messages, voiceOn, ttsSupported, lang, completed]);

  function toggleVoice() {
    setVoiceOn((v) => {
      if (v) {
        window.speechSynthesis?.cancel();
        speakingRef.current = false;
        stopMouth();
        setAvatarState(completed ? "idle" : "listening");
      }
      return !v;
    });
  }

  // --- conversational mic: continuous, self-restarting recognition -------
  // The engine runs whenever micOn && !completed && !avatarTalking. Final
  // results accumulate in finalBufRef and stream into the draft; 1.6s of
  // silence after real speech auto-sends the answer (turn-taking), exactly
  // like talking to a person. Errors never kill the conversation: network
  // failures mark voice input unavailable; transient errors just restart.
  function settleSilence() {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const text = finalBufRef.current.trim();
      if (text.length > 1) {
        finalBufRef.current = "";
        sendAnswer(text);
      }
    }, 1600);
  }

  function startRecognition() {
    if (!speechSupported || recogRef.current || !micOnRef.current) return;
    const Recog = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new Recog();
    recog.lang = lang === "sw" ? "sw-KE" : "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    recog.onresult = (e) => {
      let interim = "";
      let gotFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalBufRef.current += (finalBufRef.current ? " " : "") + r[0].transcript.trim();
          gotFinal = true;
        } else {
          interim += r[0].transcript;
        }
      }
      if (gotFinal) settleSilence();
      const combined = (finalBufRef.current + " " + interim).trim();
      setDraft(combined);
      if (combined.length > 0) {
        // speech detected → (re)arm the silence window
        settleSilence();
      }
    };
    recog.onerror = (e) => {
      if (["network", "service-not-allowed", "not-allowed"].includes(e.error)) {
        setVoiceInputBroken(true);
        recogWantRef.current = false;
      }
      // "no-speech" and "aborted" are normal in a continuous session — restart.
    };
    recog.onend = () => {
      recogRef.current = null;
      setListening(false);
      // Self-heal: keep the mic open for the whole conversation unless the
      // user muted, the room is over, or the platform broke recognition.
      if (recogWantRef.current && micOnRef.current && !voiceInputBroken) {
        setTimeout(() => {
          if (recogWantRef.current && micOnRef.current && !recogRef.current) {
            startRecognition();
          }
        }, 250);
      }
    };
    recogRef.current = recog;
    try {
      recog.start();
      setListening(true);
    } catch {
      recogRef.current = null; // already started — harmless
    }
  }

  function stopRecognition() {
    recogWantRef.current = false;
    clearTimeout(silenceTimerRef.current);
    const recog = recogRef.current;
    recogRef.current = null;
    try {
      recog?.stop?.();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }

  // Master control: mic want ↔ engine lifecycle (also re-evaluated when the
  // avatar starts/stops talking, via the speaking effect below).
  useEffect(() => {
    if (micOn && !completed && !voiceInputBroken && !speakingRef.current) {
      recogWantRef.current = true;
      if (!recogRef.current) startRecognition();
    } else if (!micOn || completed) {
      stopRecognition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn, completed, voiceInputBroken]);

  // Pause capture while the avatar speaks (avoid picking up its voice),
  // resume when it goes back to listening.
  useEffect(() => {
    if (avatarState === "talking") {
      // keep the want-flag: recognition restarts when the avatar finishes
      stopRecognition();
      recogWantRef.current = micOn;
    } else if (micOn && !completed && !voiceInputBroken && !recogRef.current) {
      recogWantRef.current = true;
      startRecognition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarState]);

  async function sendAnswer(contentArg) {
    const content = (contentArg ?? draft).trim();
    if (!content || sending || completed) return;
    stopRecognition();
    finalBufRef.current = "";
    setSending(true);
    setError(null);
    try {
      const data = await interviewsApi.textAnswer(
        sessionId,
        content
      );
      setDraft("");
      if (data.answer) {
        setMessages((messages) => [
          ...messages,
          {
            id: data.answer_id || `answer-${Data.now()}`,
            role: "user",
            content: data.answer,
        
          },
        ]);
      }else{
        setMessages((messages) => [
          ...messages,
          {
            id: `answer-${Date.now()}`,
            role: "user",
            content,
          },
        ]);
      }

      const nextQuestion = data.next_question || data.question || data.reply;
      if (nextQuestion) {
        setMessages((messages) => [
          ...messages,
          {
            id:
              data.next_question_id ||
              data.question_id ||
              `question-${Date.now()}`,
              role: "ai",
              content: nextQuestion,
          },
        ]);
      }
      if (data.completed) {
        setCompleted(true);
      }

      if (typeof data.questionIndex === "number") {
        setQuestionIndex(data.questionIndex);
      }
    } catch (err) {
      console.error("Failed to send interview answer:",err);
      if (err.response?.status === 409 && err.response?.data?.error === "session_closed") {
        setCompleted(true);
      } else {
        setError(t("sessionRoom.send_error"));
      }
    } finally {
      setSending(false);
    }
  }

  async function endEarly() {
    stopRecognition();
    window.speechSynthesis?.cancel();
    try {
      await client.post(`/interviewee/interview-sessions/${sessionId}/complete`);
    } finally {
      setCompleted(true);
      setAvatarState("idle");
      stopMouth();
    }
  }

  function handleContinue(shouldContinue) {
    if (shouldContinue) navigate("/interviewee/interviews");
    else navigate(`/interviewee/sessions/${sessionId}/report`);
  }

  // Exit the room: back to the sessions list (the room is left intact —
  // state is server-side, so the session can be resumed from there).
  function exitRoom() {
    navigate("/interviewee/sessions");
  }

  /* The room must own the whole viewport, but React Router renders this page
     inside PageTransition, whose CSS transform would trap position:fixed to
     the page box (the room measured 0px tall). Portalling to <body> escapes
     the transformed ancestor entirely — the shell's own fixed inset-0 then
     covers the screen for real. */


  if (booting) {
    return (
      <RoomPortal>
        <div className="room-shell flex items-center justify-center">
          <p className="text-sm text-slate-400">{t("common.loading")}</p>
        </div>
      </RoomPortal>
    );
  }

  if (completed && showContinuePrompt) {
    return (
      <RoomPortal>
        <div className="room-shell flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-6">
            <h2 className="text-xl font-semibold text-slate-100">{t("interviews.session_complete_title")}</h2>
            <p className="text-slate-400">{t("interviews.continue_prompt")}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => handleContinue(true)} className="room-btn-primary">
                {t("interviews.continue")}
              </button>
              <button onClick={() => handleContinue(false)} className="room-btn-ghost">
                {t("interviews.stop")}
              </button>
            </div>
          </div>
        </div>
      </RoomPortal>
    );
  }

  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");
  const micActive = listening && micOn && !completed;

  const micButton = (
    <button
      type="button"
      onClick={() => setMicOn((v) => !v)}
      disabled={voiceInputBroken}
      className={`room-micbtn ${micActive ? "room-micbtn--live" : ""} ${!micOn ? "room-micbtn--off" : ""}`}
      title={!micOn ? t("sessionRoom.mic_on") : t("sessionRoom.mic_off")}
      aria-label={!micOn ? t("sessionRoom.mic_on") : t("sessionRoom.mic_off")}
      aria-pressed={micOn}
    >
      {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      <span className="hidden sm:inline">
        {micActive ? t("sessionRoom.mic_live") : micOn ? t("sessionRoom.mic_ready") : t("sessionRoom.mic_muted")}
      </span>
    </button>
  );

  return (
    <RoomPortal>
    <div className="room-shell flex flex-col">
      {/* ------- Room topbar: identity + status + controls + exit ------- */}
      <header className="room-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <span className="room-brand" aria-hidden="true">Z</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{title}</p>
            {scheduledFor && (
              <p className="truncate text-[11px] text-slate-400">
                {t("interviews.scheduled_for", { time: new Date(scheduledFor).toLocaleString() })}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className={`room-status ${completed ? "room-status--done" : "room-status--live"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${completed ? "bg-emerald-400" : "animate-pulse bg-rose-400"}`} />
            {completed ? t("sessionRoom.status_complete") : t("sessionRoom.status_live")}
          </span>

          {micButton}

          {voiceEnabled && (
            <button
              type="button"
              onClick={toggleVoice}
              className="room-iconbtn"
              title={voiceOn ? t("sessionRoom.voice_off") : t("sessionRoom.voice_on")}
              aria-label={voiceOn ? t("sessionRoom.voice_off") : t("sessionRoom.voice_on")}
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}

          {/* Exit: confirm first — leaving mid-interview should be deliberate */}
          {confirmExit ? (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={endEarly} className="room-btn-danger !px-2.5 !py-1.5 !text-[11px]">
                {t("sessionRoom.exit_end")}
              </button>
              <button
                type="button"
                onClick={exitRoom}
                className="room-btn-ghost !px-2.5 !py-1.5 !text-[11px]"
              >
                {t("sessionRoom.exit_keep")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="room-iconbtn"
                aria-label={t("common.cancel")}
              >
                <LogOut className="h-4 w-4 rotate-90" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmExit(true)}
              className="room-btn-ghost !px-3 !py-1.5 !text-xs"
              title={t("sessionRoom.exit")}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("sessionRoom.exit")}</span>
            </button>
          )}
        </div>
      </header>

      {/* The video stage: the portrait fills the framed area between the top
          bar and the composer — a tile, not a full bleed. Overlays stay
          inside the frame. */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
        <div className="room-stageframe relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <InterviewerPortrait state={avatarState} energy={mouth} />
          <div className="room-portrait-scrim" aria-hidden="true" />

          {/* Status line pinned top-left over the video */}
          <div className="relative z-10 flex items-center gap-2 pt-3 pl-4">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                avatarState === "talking" ? "bg-green-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="room-caption-badge">
              {avatarState === "talking"
                ? t("sessionRoom.avatar_speaking")
                : micActive
                  ? t("sessionRoom.avatar_listening")
                  : t("sessionRoom.avatar_idle")}
            </span>
          </div>

          {/* Caption + self-view along the bottom edge, like call overlays */}
          <div className="room-caption-row relative z-10 mt-auto flex items-end justify-between gap-4 p-4">
            <div className="min-w-0 flex-1 pr-36 sm:pr-44">
            <p className="room-caption-kicker">{t("sessionRoom.interviewer")}</p>
            <p className="room-caption-text">{lastAiMessage?.content}</p>
            {totalQuestions > 0 && !completed && (
              <p className="room-caption-progress">
                {t("sessionRoom.progress", {
                  n: Math.min(answeredCount + 1, totalQuestions),
                  count: totalQuestions,
                })}
              </p>
            )}
          </div>

          {/* Self-view PiP — the stream is wired by ref callback, so the
              node can be recreated freely without losing the feed */}
          <div className="room-pip">
            <video
              data-selfview
              ref={attachSelfView}
              muted
              playsInline
              autoPlay
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {cameraState !== "on" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-1 text-center text-[10px] text-slate-400">
                <Video className="h-4 w-4" />
                <span>
                  {cameraState === "denied"
                    ? t("sessionRoom.camera_denied")
                    : t("sessionRoom.camera_starting")}
                </span>
                {cameraState === "denied" && (
                  <button
                    type="button"
                    onClick={() => setCameraNonce((n) => n + 1)}
                    className="text-[10px] text-slate-300 underline hover:text-white"
                  >
                    {t("sessionRoom.camera_retry")}
                  </button>
                )}
              </div>
            )}
            {cameraState === "on" && (
              <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">
                {t("sessionRoom.you")}
              </span>
            )}
          </div>          </div>
        </div>
      </main>

        {/* Composer — a translucent bar over the video, like call controls */}
        <div className="room-composerbar relative z-20">

            {/* Composer — voice-first: the mic is the primary input */}
            {completed ? (
              <div className="space-y-3">
                <p className="room-panel px-4 py-3 text-sm text-slate-300">
                  {t("sessionRoom.done_note")}
                </p>
                <button
                  onClick={() => setShowContinuePrompt(true)}
                  className="room-btn-primary w-full py-3"
                >
                  {t("sessionRoom.finish")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {voiceInputBroken && (
                  <p className="text-xs text-slate-500">{t("sessionRoom.voice_unavailable")}</p>
                )}
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAnswer();
                    }
                  }}
                  rows={3}
                  maxLength={5000}
                  placeholder={
                    micActive
                      ? t("sessionRoom.placeholder_live")
                      : t("sessionRoom.placeholder")
                  }
                  className="room-textarea"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {micActive ? t("sessionRoom.send_hint_live") : t("sessionRoom.send_hint")}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={endEarly} className="room-btn-ghost">
                      {t("sessionRoom.end_early")}
                    </button>
                    <button
                      onClick={() => sendAnswer()}
                      disabled={!draft.trim() || sending}
                      className="room-btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <SendHorizonal className="h-4 w-4" />
                      {sending ? t("common.loading") : t("sessionRoom.send")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-center text-sm font-semibold text-rose-400">{error}</p>}
        </div>

        {/* Live transcript — a floating glass drawer over the video (desktop) */}
        <aside className="room-transcript hidden lg:flex flex-col">
          <header className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t("sessionRoom.transcript_title")}
            </h2>
            <span className="text-[10px] font-semibold text-slate-500">
              {t("sessionRoom.transcript_count", { count: messages.length })}
            </span>
          </header>
          <div ref={transcriptRef} className="room-transcript-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {messages.map((m) => (
              <article
                key={m.id}
                className={`room-msg ${m.role === "ai" ? "room-msg--ai" : "room-msg--you"}`}
              >
                <span className="room-msg-role">
                  {m.role === "ai" ? t("sessionRoom.interviewer") : t("sessionRoom.you")}
                </span>
                <p>{m.content}</p>
              </article>
            ))}
            {/* Interim speech appears live at the bottom while the user talks */}
            {draft.trim() && !completed && (
              <article className="room-msg room-msg--you room-msg--interim">
                <span className="room-msg-role">{t("sessionRoom.you")}</span>
                <p>{draft}</p>
              </article>
            )}
          </div>
        </aside>

      {/* Mobile transcript — translucent panel above the composer */}
      <details className="room-panel relative z-10 mx-4 mb-4 overflow-hidden bg-[rgba(11,15,23,0.85)] lg:hidden">
        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-slate-200">
          {t("sessionRoom.transcript_toggle")}
        </summary>
        <div className="max-h-64 divide-y divide-white/5 overflow-y-auto border-t border-white/5">
          {messages.map((m) => (
            <article key={m.id} className="flex gap-3 p-3">
              <span
                className={`mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                  m.role === "ai" ? "text-brand-blue" : "text-brand-pink"
                }`}
              >
                {m.role === "ai" ? t("sessionRoom.interviewer") : t("sessionRoom.you")}
              </span>
              <p className="flex-1 whitespace-pre-wrap break-words text-xs text-slate-300">{m.content}</p>
            </article>
          ))}
        </div>
      </details>
    </div>
    </RoomPortal>
  );
}
