import axios from "axios";

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

// v2: re-seeded to replace Swahili seed content with English (ZURI rebrand).
const DB_KEY = "mock_db_v2";

function now() {
  return new Date().toISOString();
}
function hoursFromNow(h) {
  return new Date(Date.now() + h * 3600 * 1000).toISOString();
}
function daysFromNow(d, hour = 10) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
}
function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function uid(kind, db) {
  db.seq[kind] = (db.seq[kind] || 0) + 1;
  return db.seq[kind];
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Seed fixtures — a small, coherent demo world
// ---------------------------------------------------------------------------

function seedDb() {
  return {
    seq: { interviewee: 11, interviewer: 2, interview: 3, slot: 3, session: 2, message: 100, document: 1 },
    interviewees: [
      {
        id: 10,
        jina: "Royal Flow",
        namba_ya_simu: "+255 700 000 010",
        barua_pepe: "royal.flow@example.com",
        onboarding_step: 4,
        imethibitishwa: true,
        kiwango_cha_elimu: "diploma",
        sekta: "Information Technology",
        taaluma: "Software Developer",
        utaalamu: "React Frontend",
        uzoefu: "3-5",
        ujuzi: ["JavaScript", "React", "SQL"],
        created_at: daysFromNow(-9),
      },
      {
        id: 7,
        jina: "Neema John",
        namba_ya_simu: "+255 700 000 007",
        barua_pepe: "neema.john@example.com",
        onboarding_step: 4,
        imethibitishwa: false, // pending document review (Reviews page)
        kiwango_cha_elimu: "bachelor",
        sekta: "Afya",
        taaluma: "Muuguzi",
        utaalamu: "Uchasifu wa Wagonjwa",
        uzoefu: "1-3",
        ujuzi: ["Huduma kwa Wagonjwa", "Dawa za Dharura"],
        created_at: daysFromNow(-4),
      },
    ],
    interviewers: [
      {
        id: 1,
        jina_la_kampuni: "DemoTech Ltd",
        barua_pepe_ya_kampuni: "careers@demotech.example.com",
        jina: "Amina Hassan",
        barua_pepe_binafsi: "amina@demotech.example.com",
        nenosiri: "password123",
        onboarding_step: 4,
        verified_company: true,
        verified_personal: true,
        created_at: daysFromNow(-30),
      },
    ],
    codes: {},
    interviews: [
      {
        id: 1,
        interviewer_id: 1,
        title: "Senior Frontend Developer (React)",
        sekta: "Information Technology",
        taaluma: "Software Developer",
        kiwango_cha_elimu_kinachohitajika: "diploma",
        ujuzi_unaohitajika: ["JavaScript", "React", "SQL"],
        description:
          "We are looking for a developer with React experience to build high-quality user interfaces for our product team.",
        status: "active",
        created_at: daysFromNow(-6),
      },
      {
        id: 2,
        interviewer_id: 1,
        title: "Data Analyst — Growth Team",
        sekta: "Information Technology",
        taaluma: "Data Analyst",
        kiwango_cha_elimu_kinachohitajika: "",
        ujuzi_unaohitajika: ["SQL", "Python"],
        description: "Analyze growth funnels and dashboards for the product team.",
        status: "active",
        created_at: daysFromNow(-2),
      },
    ],
    slots: [
      { id: 1, interviewer_id: 1, starts_at: daysFromNow(1, 10), ends_at: daysFromNow(1, 11), status: "available" },
      { id: 2, interviewer_id: 1, starts_at: daysFromNow(2, 14), ends_at: daysFromNow(2, 15), status: "booked" },
    ],
    sessions: [
      {
        // Completed session by Royal Flow — powers history, reports, transcripts
        id: 1,
        interviewee_id: 10,
        interviewer_id: 1,
        interview_id: 1,
        title: "Senior Frontend Developer (React)",
        status: "imekamilika",
        lang: "en",
        camera_ok: true,
        mic_ok: true,
        question_index: 5,
        scheduled_for: null,
        started_at: daysFromNow(-3, 11),
        completed_at: daysFromNow(-3, 11.4),
        no_show: false,
        interviewer_decision: null,
        interviewer_note: "",
        reviewed_at: null,
        report: {
          score: 74,
          breakdown: {
            completion: { score: 30, max: 30, answered: 5, planned: 5 },
            effort: { score: 14, max: 20, mean_chars: 342 },
            engagement: { score: 30, max: 30, finished: true },
            quality: { score: 0, max: 20, mean_coverage: 0 },
          },
          skills: { covered: ["JavaScript", "React"], missed: ["SQL"] },
          quality: { answers: [] },
          duration_seconds: 1440,
        },
      },
      {
        // Booked, upcoming session (join flow from the candidate dashboard)
        id: 2,
        interviewee_id: 10,
        interviewer_id: 1,
        interview_id: 2,
        title: "Data Analyst — Growth Team",
        status: "imepangwa",
        lang: "en",
        camera_ok: null,
        mic_ok: null,
        question_index: 0,
        scheduled_for: daysFromNow(1, 10),
        started_at: null,
        completed_at: null,
        no_show: false,
        interviewer_decision: null,
        interviewer_note: "",
        reviewed_at: null,
        report: null,
      },
    ],
    messages: [
      { id: 1, session_id: 1, role: "ai", content: "Welcome! To start, tell me about yourself and your experience as a Software Developer." },
      { id: 2, session_id: 1, role: "user", content: "I am a frontend developer with 4 years of experience building React applications for fintech and health products." },
      { id: 3, session_id: 1, role: "ai", content: "Great. Describe a project where you used JavaScript heavily. What problem did it solve?" },
      { id: 4, session_id: 1, role: "user", content: "I rebuilt a legacy jQuery dashboard in JavaScript modules, cutting load time by 60% and simplifying onboarding for new developers." },
      { id: 5, session_id: 1, role: "ai", content: "Nice. How have you used React in production? Talk through architecture decisions you made." },
      { id: 6, session_id: 1, role: "user", content: "Component library with storybook, code splitting per route, and a design token system shared with design." },
      { id: 7, session_id: 1, role: "ai", content: "Tell me about a challenging deadline and how you handled it." },
      { id: 8, session_id: 1, role: "user", content: "We had a launch in two weeks with a half-finished feature; I cut scope to the core flow, shipped on time, and iterated after launch." },
      { id: 9, session_id: 1, role: "ai", content: "That concludes our interview. Thank you — your report will be available shortly." },
    ],
    documents: [
      {
        id: 1,
        interviewee_id: 7,
        file_name: "neema-diploma.pdf",
        file_path: null,
        hali: "inasubiri",
        note: "",
        reviewed_by: null,
        reviewed_at: null,
        uploaded_at: daysFromNow(-2),
      },
    ],
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted store — reseed below */
  }
  const db = seedDb();
  saveDb(db);
  return db;
}
function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* storage full/private mode: demo still works for this session */
  }
}
const db = loadDb();

window.__resetMockDb = function resetMockDb() {
  localStorage.removeItem(DB_KEY);
  console.info("[mock] store reset — reload to reseed the demo world");
};

// ---------------------------------------------------------------------------
// Mock auth tokens: "mocktk_<base64 type:id>" — decodable without a secret
// ---------------------------------------------------------------------------

function issueToken(type, id) {
  return "mocktk_" + btoa(`${type}:${id}`);
}
function actorFrom(config) {
  const header = config?.headers?.Authorization || config?.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token || !token.startsWith("mocktk_")) return null;
  try {
    const [type, id] = atob(token.slice(7)).split(":");
    return { type, id: Number(id) };
  } catch {
    return null;
  }
}
function currentInterviewee(config) {
  const actor = actorFrom(config);
  if (actor?.type === "interviewee") return db.interviewees.find((u) => u.id === actor.id) || null;
  // Fall back to the newest signup (covers pre-auth wizard flows).
  return [...db.interviewees].sort((a, b) => b.id - a.id)[0] || null;
}
function currentInterviewer(config) {
  const actor = actorFrom(config);
  if (actor?.type === "interviewer") return db.interviewers.find((u) => u.id === actor.id) || null;
  const staging = actorFrom(config)?.type === "interviewer_staging";
  if (staging) return db.interviewers.find((u) => u.id === actor.id) || null;
  return db.interviewers[0] || null;
}

// ---------------------------------------------------------------------------
// Rule-based scoring (60 skills / 25 education / 15 verification)
// ---------------------------------------------------------------------------

const EDU_RANK = { primary: 0, secondary: 1, certificate: 2, diploma: 3, bachelor: 4, master: 5, phd: 6 };

function scoreCandidate(profile, interview) {
  const required = interview.ujuzi_unaohitajika || [];
  const have = new Set(profile.ujuzi || []);
  const matched = required.filter((s) => have.has(s));
  const skillScore = required.length ? Math.round((matched.length / required.length) * 60) : 60;

  let eduScore = 25;
  if (interview.kiwango_cha_elimu_kinachohitajika) {
    const need = EDU_RANK[interview.kiwango_cha_elimu_kinachohitajika] ?? 0;
    const got = EDU_RANK[profile.kiwango_cha_elimu] ?? -1;
    eduScore = got >= need ? 25 : got >= 0 ? Math.max(0, 25 - (need - got) * 8) : 0;
  }
  const verScore = profile.imethibitishwa ? 15 : 7;
  return {
    match_score: skillScore + eduScore + verScore,
    breakdown: { skills: { score: skillScore, matched }, education: { score: eduScore }, verification: { score: verScore } },
  };
}

function verificationString(user, docs) {
  if (user.imethibitishwa) return "imethibitishwa";
  const mine = docs.filter((d) => d.interviewee_id === user.id);
  if (mine.some((d) => d.hali === "imekataliwa")) return "imekataliwa";
  if (mine.some((d) => d.hali === "inasubiri")) return "inasubiri";
  return "hakuna";
}

// ---------------------------------------------------------------------------
// The AI interviewer: question plan + transcript generation
// ---------------------------------------------------------------------------

function buildPlan(interview) {
  const skills = (interview.ujuzi_unaohitajika || []).slice(0, 3);
  const qs = [
    `Welcome! To start, tell me about yourself and your experience as a ${interview.taaluma}.`,
    ...skills.map((s) => `Describe a project where you used ${s}. What problem did it solve, and what was your role?`),
    "Tell me about a challenging deadline you faced recently. How did you handle it?",
    "That concludes the planned questions. Do you have anything you would like to add or ask? (This ends the interview.)",
  ];
  return qs;
}

function keywordHits(text, skills) {
  const t = text.toLowerCase();
  return skills.filter((s) => t.includes(s.toLowerCase()));
}
const STRUCTURE_WORDS = ["situation", "task", "action", "result", "team", "deadline", "problem", "solution", "learned"];

function structureHits(text) {
  const t = text.toLowerCase();
  return STRUCTURE_WORDS.filter((w) => t.includes(w));
}

function computeReport(session, messages) {
  const answers = messages.filter((m) => m.role === "user");
  const interview = db.interviews.find((i) => i.id === session.interview_id);
  const skills = interview?.ujuzi_unaohitajika || [];

  const planned = Math.max(1, session.question_index + 1);
  const answered = answers.length;
  const completion = { score: Math.round(Math.min(1, answered / planned) * 30), max: 30, answered, planned };

  const chars = answers.map((a) => a.content.length);
  const meanChars = chars.length ? Math.round(chars.reduce((a, b) => a + b, 0) / chars.length) : 0;
  const effort = { score: Math.min(20, Math.round(meanChars / 25)), max: 20, mean_chars: meanChars };

  const finished = session.status === "imekamilika";
  const engagement = { score: finished ? 30 : Math.round((answered / planned) * 30), max: 30, finished };

  const covered = [];
  const perAnswer = answers.map((a, i) => {
    const kh = keywordHits(a.content, skills);
    const sh = structureHits(a.content);
    kh.forEach((k) => !covered.includes(k) && covered.push(k));
    const coverage = skills.length ? Math.min(1, kh.length / Math.min(2, skills.length)) : 0;
    return { index: i + 1, skill: skills[i % Math.max(1, skills.length)] || null, coverage, keyword_hits: kh, structure_hits: sh };
  });
  const meanCoverage = perAnswer.length ? perAnswer.reduce((a, b) => a + (b.coverage || 0), 0) / perAnswer.length : 0;
  const quality = { score: Math.round(meanCoverage * 20), max: 20, mean_coverage: meanCoverage };
  const missed = skills.filter((s) => !covered.includes(s));

  const score = completion.score + effort.score + engagement.score + quality.score;
  const duration = session.started_at
    ? Math.max(60, Math.round((new Date(session.completed_at || now()) - new Date(session.started_at)) / 1000))
    : null;

  return {
    score,
    breakdown: { completion, effort, engagement, quality },
    skills: { covered, missed },
    quality: { answers: perAnswer },
    duration_seconds: duration,
  };
}

function finishSession(session) {
  session.status = "imekamilika";
  session.completed_at = now();
  const messages = db.messages.filter((m) => m.session_id === session.id);
  session.report = computeReport(session, messages);
}

// ---------------------------------------------------------------------------
// Response helpers (axios-shaped, like the real adapter would return)
// ---------------------------------------------------------------------------

function ok(config, data, status = 200) {
  return {
    data,
    status,
    statusText: status === 201 ? "Created" : "OK",
    headers: {},
    config,
    request: { mock: true },
  };
}
function fail(config, status, error) {
  throw new axios.AxiosError(error, String(status), config, { mock: true }, {
    data: { error },
    status,
    statusText: "Error",
    headers: {},
    config,
  });
}
function parseBody(config) {
  if (!config?.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data; // FormData or object
}

// ---------------------------------------------------------------------------
// Route table — mirrors the removed Express backend exactly
// ---------------------------------------------------------------------------

const routes = [
  // ---- auth ----
  ["get", /^\/auth\/me$/, (m, body, config) => {
    const actor = actorFrom(config);
    if (!actor) fail(config, 401, "invalid_token");
    if (actor.type === "interviewee") {
      const u = db.interviewees.find((x) => x.id === actor.id);
      if (!u) fail(config, 401, "invalid_token");
      const clean = { ...u, type: "interviewee" };
      return ok(config, { user: clean, onboardingStep: u.onboarding_step });
    }
    const u = db.interviewers.find((x) => x.id === actor.id);
    if (!u) fail(config, 401, "invalid_token");
    return ok(config, { user: { ...u, type: actor.type }, onboardingStep: u.onboarding_step });
  }],

  // ---- interviewee signup ----
  ["post", /^\/interviewee\/profile$/, (m, body) => {
    if (!body.barua_pepe || !/.+@.+\..+/.test(body.barua_pepe)) fail(m, 400, "invalid_email");
    if (db.interviewees.some((u) => u.barua_pepe === body.barua_pepe)) fail(m, 409, "email_taken");
    const user = {
      id: uid("interviewee", db),
      jina: body.jina || "",
      namba_ya_simu: body.namba_ya_simu || "",
      barua_pepe: body.barua_pepe,
      onboarding_step: 1,
      imethibitishwa: false,
      created_at: now(),
    };
    db.interviewees.push(user);
    const code = makeCode();
    db.codes[`ie:${user.id}`] = code;
    console.info(`[mock] verification code for ${body.barua_pepe}: ${code}`);
    return ok(m, { intervieweeId: user.id }, 201);
  }],
  ["post", /^\/interviewee\/profile\/verify$/, (m, body, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");
    const expected = db.codes[`ie:${user.id}`];
    // Demo-friendly: any 6-digit code verifies; the issued one is in the console.
    if (!/^\d{6}$/.test(body.code || "")) fail(m, 400, "invalid_code");
    if (expected) delete db.codes[`ie:${user.id}`];
    user.imethibitishwa = true;
    user.onboarding_step = Math.max(user.onboarding_step, 2);
    return ok(m, { token: issueToken("interviewee", user.id), interviewee: user });
  }],
  ["post", /^\/interviewee\/profile\/resend-code$/, (m, b, config) => {
    const user = currentInterviewee(config);
    const code = makeCode();
    if (user) db.codes[`ie:${user.id}`] = code;
    console.info(`[mock] new verification code for ${user?.barua_pepe}: ${code}`);
    return ok(m, { cooldownSeconds: 45 });
  }],
  ["post", /^\/interviewee\/login$/, (m, body) => {
    const user = db.interviewees.find((u) => u.barua_pepe === (body.barua_pepe || "").trim());
    if (!user) fail(m, 404, "not_found");
    return ok(m, { token: issueToken("interviewee", user.id), interviewee: user });
  }],
  ["post", /^\/interviewee\/education-skills$/, (m, body, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");
    Object.assign(user, {
      kiwango_cha_elimu: body.kiwango_cha_elimu,
      sekta: body.sekta,
      taaluma: body.taaluma,
      utaalamu: body.utaalamu,
      uzoefu: body.uzoefu,
      ujuzi: body.ujuzi || [],
      onboarding_step: 3,
    });
    return ok(m, { saved: true });
  }],
  ["post", /^\/interviewee\/documents$/, (m, b, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");
    const form = b instanceof FormData ? b : null;
    const files = form ? form.getAll("documents") : [];
    if (!files.length) fail(m, 400, "no_files");
    for (const f of files) {
      db.documents.push({
        id: uid("document", db),
        interviewee_id: user.id,
        file_name: f?.name || "document.pdf",
        file_path: null, // no server storage in frontend-only mode
        hali: "inasubiri",
        note: "",
        reviewed_by: null,
        reviewed_at: null,
        uploaded_at: now(),
      });
    }
    user.onboarding_step = 4;
    return ok(m, { uploaded: files.length }, 201);
  }],

  // ---- interviewee app ----
  ["get", /^\/interviewee\/dashboard$/, (m, b, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");
    const mine = db.sessions.filter((s) => s.interviewee_id === user.id);
    const verification = verificationString(user, db.documents);
    const fields = ["kiwango_cha_elimu", "sekta", "taaluma", "utaalamu", "uzoefu", "ujuzi"];
    const filled = fields.filter((f) => (Array.isArray(user[f]) ? user[f].length : Boolean(user[f]))).length;

    return ok(m, {
      profile: {
        jina: user.jina,
        kiwango_cha_elimu: user.kiwango_cha_elimu,
        sekta: user.sekta,
        taaluma: user.taaluma,
        utaalamu: user.utaalamu,
        uzoefu: user.uzoefu,
        ujuzi: user.ujuzi || [],
      },
      verification,
      upcoming: mine
        .filter((s) => s.status === "imepangwa")
        .map((s) => ({ id: s.id, title: s.title, jina_la_kampuni: campName(s.interviewer_id), scheduled_for: s.scheduled_for })),
      history: mine
        .filter((s) => s.status === "imekamilika")
        .map((s) => ({ id: s.id, title: s.title, jina_la_kampuni: campName(s.interviewer_id), completed_at: s.completed_at, score: s.report?.score ?? null })),
      // "Recommended skill" rail — closest unowned skills from active postings.
      recommendedSkills: (() => {
        const have = new Set(user.ujuzi || []);
        const pool = new Map();
        for (const i of db.interviews) {
          if (i.status !== "active") continue;
          for (const s of i.ujuzi_unaohitajika || []) {
            if (!have.has(s) && !pool.has(s)) pool.set(s, i.sekta);
          }
        }
        return [...pool.entries()].slice(0, 4).map(([name, sekta]) => ({ name, sekta }));
      })(),
      stats: {
        upcoming: mine.filter((s) => s.status === "imepangwa").length,
        completed: mine.filter((s) => s.status === "imekamilika").length,
        completeness: Math.round((filled / fields.length) * 100),
      },
      topMatches: db.interviews
        .filter((i) => i.status === "active")
        .map((i) => ({ ...i, ...scoreCandidate(user, i), jina_la_kampuni: campName(i.interviewer_id), score: scoreCandidate(user, i).match_score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ id, title, taaluma, jina_la_kampuni, score }) => ({ id, title, taaluma, jina_la_kampuni, score })),
    });
  }],
  ["get", /^\/interviewee\/interviews\/matched$/, (m, b, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");
    const interviews = db.interviews
      .filter((i) => i.status === "active")
      .map((i) => {
        const sc = scoreCandidate(user, i);
        return {
          ...i,
          jina_la_kampuni: campName(i.interviewer_id),
          match_score: sc.match_score,
          match_breakdown: sc.breakdown,
        };
      })
      .sort((a, b) => b.match_score - a.match_score);
    return ok(m, { interviews });
  }],
  ["get", /^\/interviewee\/interviewers\/(\d+)\/slots$/, (m, b, config, params) => {
    const slots = db.slots.filter((s) => s.interviewer_id === Number(params[0]) && s.status === "tupu");
    return ok(m, { slots });
  }],
  ["post", /^\/interviewee\/slots\/(\d+)\/book$/, (m, body, config, params) => {
    const user = currentInterviewee(config);
    const slot = db.slots.find((s) => s.id === Number(params[0]));
    if (!slot) fail(m, 404, "slot_not_found");
    if (slot.status !== "tupu") fail(m, 409, "slot_taken");
    const interview = db.interviews.find((i) => i.id === body.interviewId);
    if (!interview) fail(m, 404, "interview_not_found");
    slot.status = "imechukuliwa";
    const session = {
      id: uid("session", db),
      interviewee_id: user?.id,
      interviewer_id: interview.interviewer_id,
      interview_id: interview.id,
      title: interview.title,
      status: "imepangwa",
      lang: "en",
      camera_ok: null,
      mic_ok: null,
      question_index: 0,
      scheduled_for: slot.starts_at,
      started_at: null,
      completed_at: null,
      no_show: false,
      interviewer_decision: null,
      interviewer_note: "",
      reviewed_at: null,
      report: null,
    };
    db.sessions.push(session);
    return ok(m, { session: { id: session.id, scheduled_for: session.scheduled_for } }, 201);
  }],
  ["post", /^\/interviewee\/interviews\/(\d+)\/start$/, (m, body, config, params) => {
    const user = currentInterviewee(config);
    const interview = db.interviews.find((i) => i.id === Number(params[0]));
    if (!interview) fail(m, 404, "interview_not_found");
    const session = {
      id: uid("session", db),
      interviewee_id: user?.id,
      interviewer_id: interview.interviewer_id,
      interview_id: interview.id,
      title: interview.title,
      status: "inaendelea",
      lang: body.lang || "en",
      camera_ok: Boolean(body.cameraOk),
      mic_ok: Boolean(body.micOk),
      question_index: 0,
      scheduled_for: null,
      started_at: now(),
      completed_at: null,
      no_show: false,
      interviewer_decision: null,
      interviewer_note: "",
      reviewed_at: null,
      report: null,
    };
    db.sessions.push(session);
    return ok(m, { sessionId: session.id }, 201);
  }],
  ["get", /^\/interviewee\/interview-sessions\/active$/, (m, b, config) => {
    const user = currentInterviewee(config);
    const session = db.sessions.find((s) => s.interviewee_id === user?.id && s.status === "inaendelea");
    if (!session) fail(m, 404, "no_active_session");
    return ok(m, { session });
  }],
  ["post", /^\/interviewee\/interview-sessions\/(\d+)\/consent$/, (m, body, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    session.camera_ok = Boolean(body.cameraOk);
    session.mic_ok = Boolean(body.micOk);
    if (!session.started_at) {
      session.status = "inaendelea";
      session.started_at = now();
    }
    session.lang = body.lang || session.lang || "en";
    return ok(m, { consented: true });
  }],
  ["post", /^\/interviewee\/interview-sessions\/(\d+)\/begin$/, (m, b, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    let messages = db.messages.filter((m2) => m2.session_id === session.id);
    if (!messages.length) {
      const interview = db.interviews.find((i) => i.id === session.interview_id);
      const plan = buildPlan(interview || { taaluma: "taaluma yako", ujuzi_unaohitajika: [] });
      session.plan = plan;
      messages = [{ id: uid("message", db), session_id: session.id, role: "ai", content: plan[0] }];
      db.messages.push(messages[0]);
    }
    return ok(m, {
      messages,
      questionIndex: session.question_index,
      planSize: session.plan?.length || 5,
      status: session.status,
      lang: session.lang || "en",
    });
  }],
  ["post", /^\/interviewee\/interview-sessions\/(\d+)\/answer$/, (m, body, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    if (session.status !== "inaendelea") fail(m, 409, "session_closed");
    const answer = { id: uid("message", db), session_id: session.id, role: "user", content: body.content || "" };
    db.messages.push(answer);

    if (!session.plan) {
      // Session resumed without a plan (edge): rebuild a generic one.
      session.plan = buildPlan(db.interviews.find((i) => i.id === session.interview_id) || { taaluma: "taaluma yako", ujuzi_unaohitajika: [] });
    }
    const plan = session.plan;
    session.question_index += 1;

    let replyContent;
    let completed = false;
    if (session.question_index >= plan.length - 1) {
      replyContent = "That concludes our interview. Thank you — your report will be available shortly.";
      completed = true;
    } else {
      replyContent = plan[session.question_index];
    }
    const reply = { id: uid("message", db), session_id: session.id, role: "ai", content: replyContent };
    db.messages.push(reply);

    if (completed) finishSession(session);

    return ok(m, {
      answer,
      reply,
      questionIndex: session.question_index,
      completed,
    });
  }],
  ["post", /^\/interviewee\/interview-sessions\/(\d+)\/complete$/, (m, b, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    if (session.status !== "imekamilika") finishSession(session);
    return ok(m, { completed: true });
  }],
  ["post", /^\/interviewee\/interview-sessions\/(\d+)\/cancel$/, (m, b, config, params) => {
    const id = Number(params[0]);
    const session = db.sessions.find((s) => s.id === id);
    if (session) {
      const slot = db.slots.find((s2) => s2.imechukuliwaBy === id);
      if (slot) slot.status = "tupu";
      db.sessions = db.sessions.filter((s2) => s2.id !== id);
    }
    return ok(m, { cancelled: true });
  }],
  ["get", /^\/interviewee\/interview-sessions\/(\d+)\/report$/, (m, b, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    if (session.status !== "imekamilika") fail(m, 409, "not_completed");
    return ok(m, { report: session.report || computeReport(session, db.messages.filter((m2) => m2.session_id === session.id)) });
  }],
  ["get", /^\/interviewee\/interview-sessions\/(\d+)\/feedback$/, (m, b, config, params) => {
    const session = db.sessions.find((s) => s.id === Number(params[0]));
    if (!session) fail(m, 404, "not_found");
    const interviewer = db.interviewers.find((i) => i.id === session.interviewer_id);
    return ok(m, {
      feedback: session.reviewed_at
        ? {
            decision: session.interviewer_decision,
            note: session.interviewer_note,
            interviewer_name: interviewer?.jina || "Interviewer",
            reviewed_at: session.reviewed_at,
          }
        : null,
    });
  }],

  // ---- interviewer signup ----
  ["post", /^\/interviewer\/company-profile$/, (m, body) => {
    if (!body.barua_pepe_ya_kampuni || !/.+@.+\..+/.test(body.barua_pepe_ya_kampuni)) fail(m, 400, "invalid_email");
    const iv = {
      id: uid("interviewer", db),
      jina_la_kampuni: body.jina_la_kampuni || "",
      barua_pepe_ya_kampuni: body.barua_pepe_ya_kampuni,
      onboarding_step: 1,
      verified_company: false,
      verified_personal: false,
      created_at: now(),
    };
    db.interviewers.push(iv);
    const code = makeCode();
    db.codes[`iv:${iv.id}`] = code;
    console.info(`[mock] verification code for ${body.barua_pepe_ya_kampuni}: ${code}`);
    return ok(m, { interviewerId: iv.id }, 201);
  }],
  ["post", /^\/interviewer\/company-profile\/verify$/, (m, body, config) => {
    const iv = db.interviewers.find((i) => i.id === Number(body.interviewerId));
    if (!iv) fail(m, 404, "not_found");
    if (!/^\d{6}$/.test(body.code || "")) fail(m, 400, "invalid_code");
    delete db.codes[`iv:${iv.id}`];
    iv.verified_company = true;
    iv.onboarding_step = Math.max(iv.onboarding_step, 2);
    return ok(m, { stagingToken: issueToken("interviewer_staging", iv.id) });
  }],
  ["post", /^\/interviewer\/company-profile\/resend-code$/, (m, body) => {
    const code = makeCode();
    if (body.interviewerId) db.codes[`iv:${body.interviewerId}`] = code;
    console.info(`[mock] new verification code: ${code}`);
    return ok(m, { cooldownSeconds: 45 });
  }],
  ["post", /^\/interviewer\/personal-profile$/, (m, body, config) => {
    const iv = currentInterviewer(config);
    if (!iv) fail(m, 404, "not_found");
    if ((body.nenosiri || "").length < 8) fail(m, 400, "weak_password");
    if ((body.barua_pepe_binafsi || "").toLowerCase() === iv.barua_pepe_ya_kampuni.toLowerCase()) {
      fail(m, 400, "personal_email_must_differ_from_company_email");
    }
    Object.assign(iv, {
      jina: body.jina || "",
      barua_pepe_binafsi: body.barua_pepe_binafsi,
      nenosiri: body.nenosiri,
      onboarding_step: Math.max(iv.onboarding_step, 3),
    });
    const code = makeCode();
    db.codes[`iv:${iv.id}`] = code;
    console.info(`[mock] verification code for ${body.barua_pepe_binafsi}: ${code}`);
    return ok(m, { saved: true });
  }],
  ["post", /^\/interviewer\/personal-profile\/verify$/, (m, body, config) => {
    const iv = currentInterviewer(config);
    if (!iv) fail(m, 404, "not_found");
    if (!/^\d{6}$/.test(body.code || "")) fail(m, 400, "invalid_code");
    delete db.codes[`iv:${iv.id}`];
    iv.verified_personal = true;
    iv.onboarding_step = 4;
    return ok(m, { token: issueToken("interviewer", iv.id), interviewer: iv });
  }],
  ["post", /^\/interviewer\/personal-profile\/resend-code$/, (m, b, config) => {
    const iv = currentInterviewer(config);
    const code = makeCode();
    if (iv) db.codes[`iv:${iv.id}`] = code;
    console.info(`[mock] new verification code: ${code}`);
    return ok(m, { cooldownSeconds: 45 });
  }],
  ["post", /^\/interviewer\/login$/, (m, body) => {
    const iv = db.interviewers.find((i) => i.barua_pepe_binafsi === (body.barua_pepe_binafsi || "").trim());
    if (!iv) fail(m, 404, "not_found");
    if (!iv.verified_personal) {
      return ok(m, { stagingToken: issueToken("interviewer_staging", iv.id), interviewerId: iv.id });
    }
    if (iv.nenosiri !== body.nenosiri) fail(m, 401, "invalid_credentials");
    return ok(m, { token: issueToken("interviewer", iv.id), interviewer: iv });
  }],

  // ---- interviewer app ----
  ["get", /^\/interviewer\/interviews\/mine$/, (m, b, config) => {
    const iv = currentInterviewer(config);
    const interviews = db.interviews
      .filter((i) => i.interviewer_id === iv?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return ok(m, { interviews });
  }],
  ["post", /^\/interviewer\/interviews$/, (m, body, config) => {
    const iv = currentInterviewer(config);
    if (!iv) fail(m, 404, "not_found");
    if (!body.title || body.title.trim().length < 3) fail(m, 400, "invalid_title");
    const skills = body.ujuzi_unaohitajika || [];
    if (skills.length < 1 || skills.length > 5) fail(m, 400, "invalid_skills_count");
    const interview = {
      id: uid("interview", db),
      interviewer_id: iv.id,
      title: body.title.trim(),
      sekta: body.sekta,
      taaluma: body.taaluma,
      kiwango_cha_elimu_kinachohitajika: body.kiwango_cha_elimu_kinachohitajika || "",
      ujuzi_unaohitajika: skills,
      description: body.description || "",
      status: "active",
      created_at: now(),
    };
    db.interviews.push(interview);
    return ok(m, { interview }, 201);
  }],
  ["post", /^\/interviewer\/interviews\/(\d+)\/status$/, (m, body, config, params) => {
    const iv = currentInterviewer(config);
    const interview = db.interviews.find((i) => i.id === Number(params[0]) && i.interviewer_id === iv?.id);
    if (!interview) fail(m, 404, "not_found");
    interview.status = body.status;
    return ok(m, { interview });
  }],
  ["get", /^\/interviewer\/interviews\/(\d+)\/candidates$/, (m, b, config, params) => {
    const interview = db.interviews.find((i) => i.id === Number(params[0]));
    if (!interview) fail(m, 404, "not_found");
    const candidates = db.interviewees
      .map((u) => {
        const sc = scoreCandidate(u, interview);
        return {
          id: u.id,
          jina: u.jina,
          sekta: u.sekta,
          taaluma: u.taaluma,
          utaalamu: u.utaalamu,
          kiwango_cha_elimu: u.kiwango_cha_elimu,
          uzoefu: u.uzoefu,
          ujuzi: u.ujuzi || [],
          hali_ya_uthibitisho: u.imethibitishwa ? "imethibitishwa" : "inasubiri",
          score: sc.match_score,
        };
      })
      .sort((a, b) => b.score - a.score);
    return ok(m, { posting: interview, candidates });
  }],
  ["get", /^\/interviewer\/analytics$/, (m, b, config) => {
    const iv = currentInterviewer(config);
    const mine = db.sessions.filter((s) => s.interviewer_id === iv?.id);
    return ok(m, {
      analytics: {
        postings: db.interviews.filter((i) => i.interviewer_id === iv?.id).length,
        sessions_started: mine.length,
        sessions_completed: mine.filter((s) => s.status === "imekamilika").length,
        upcoming_booked: mine.filter((s) => s.status === "imepangwa").length,
        docs_pending_review: db.documents.filter((d) => d.hali === "inasubiri").length,
        // Shortlist decisions per posting, newest first — feeds the rail.
        perPosting: db.interviews
          .filter((i) => i.interviewer_id === iv?.id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map((i) => ({
            id: i.id,
            title: i.title,
            sekta: i.sekta,
            status: i.status,
            applicants: db.interviewees.length,
            decisions: db.sessions.filter((s) => s.interview_id === i.id && s.interviewer_decision).length,
          })),
      },
    });
  }],
  ["get", /^\/interviewer\/availability$/, (m, b, config) => {
    const iv = currentInterviewer(config);
    return ok(m, { slots: db.slots.filter((s) => s.interviewer_id === iv?.id) });
  }],
  ["post", /^\/interviewer\/availability$/, (m, body, config) => {
    const iv = currentInterviewer(config);
    if (!iv) fail(m, 404, "not_found");
    const created = (body.slots || []).map((slot) => ({
      id: uid("slot", db),
      interviewer_id: iv.id,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      status: "tupu",
    }));
    db.slots.push(...created);
    return ok(m, { slots: created }, 201);
  }],
  ["get", /^\/interviewer\/sessions$/, (m, b, config) => {
    const iv = currentInterviewer(config);
    const sessions = db.sessions
      .filter((s) => s.interviewer_id === iv?.id)
      .map((s) => {
        const candidate = db.interviewees.find((u) => u.id === s.interviewee_id);
        return {
          id: s.id,
          title: s.title,
          candidate_name: candidate?.jina || "Candidate",
          status: s.status,
          scheduled_for: s.scheduled_for,
          completed_at: s.completed_at,
          report_score: s.report?.score ?? null,
          interviewer_decision: s.interviewer_decision,
          no_show: s.no_show,
        };
      })
      .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));
    return ok(m, { sessions });
  }],
  ["get", /^\/interviewer\/sessions\/(\d+)$/, (m, b, config, params) => {
    const iv = currentInterviewer(config);
    const session = db.sessions.find((s) => s.id === Number(params[0]) && s.interviewer_id === iv?.id);
    if (!session) fail(m, 404, "not_found");
    const candidate = db.interviewees.find((u) => u.id === session.interviewee_id);
    return ok(m, {
      session: {
        ...session,
        candidate_name: candidate?.jina || "Candidate",
        jina: candidate?.jina,
        kiwango_cha_elimu: candidate?.kiwango_cha_elimu,
        sekta: candidate?.sekta,
        taaluma: candidate?.taaluma,
        utaalamu: candidate?.utaalamu,
        uzoefu: candidate?.uzoefu,
        ujuzi: candidate?.ujuzi || [],
      },
      messages: db.messages.filter((m2) => m2.session_id === session.id),
    });
  }],
  ["post", /^\/interviewer\/sessions\/(\d+)\/decision$/, (m, body, config, params) => {
    const iv = currentInterviewer(config);
    const session = db.sessions.find((s) => s.id === Number(params[0]) && s.interviewer_id === iv?.id);
    if (!session) fail(m, 404, "not_found");
    if (session.status !== "imekamilika") fail(m, 409, "not_completed");
    session.interviewer_decision = body.decision;
    session.interviewer_note = body.note || "";
    session.reviewed_at = now();
    return ok(m, { saved: true });
  }],
  ["post", /^\/interviewer\/sessions\/(\d+)\/no-show$/, (m, b, config, params) => {
    const iv = currentInterviewer(config);
    const session = db.sessions.find((s) => s.id === Number(params[0]) && s.interviewer_id === iv?.id);
    if (!session) fail(m, 404, "not_found");
    session.no_show = true;
    return ok(m, { marked: true });
  }],
  ["get", /^\/interviewer\/documents\/pending$/, (m, b, config) => {
    const pending = db.documents
      .filter((d) => d.hali === "inasubiri")
      .map((d) => {
        const u = db.interviewees.find((x) => x.id === d.interviewee_id);
        return { ...d, jina: u?.jina || "Candidate", sekta: u?.sekta, taaluma: u?.taaluma };
      });
    return ok(m, { documents: pending });
  }],
  ["post", /^\/interviewer\/documents\/(\d+)\/review$/, (m, body, config, params) => {
    const iv = currentInterviewer(config);
    const doc = db.documents.find((d) => d.id === Number(params[0]));
    if (!doc) fail(m, 404, "not_found");
    doc.hali = body.hali;
    doc.note = body.note || "";
    doc.reviewed_by = iv?.id;
    doc.reviewed_at = now();
    if (body.hali === "imethibitishwa") {
      const u = db.interviewees.find((x) => x.id === doc.interviewee_id);
      if (u) {
        u.imethibitishwa = true;
        u.onboarding_step = 4;
      }
    }
    return ok(m, { reviewed: true });
  }],

  // ---- account (self-service profile editing) ----
  // Interviewee: personal details + the education/skills fields from wizard
  // step 2. Every field is optional-but-validated; the education group keeps
  // matching consistent (same vocabulary as the wizard form).
  ["put", /^\/interviewee\/account$/, (m, body, config) => {
    const user = currentInterviewee(config);
    if (!user) fail(m, 404, "not_found");

    if (body.jina !== undefined) {
      const jina = String(body.jina).trim();
      if (jina.length < 2) fail(m, 400, "invalid_name");
      user.jina = jina;
    }
    if (body.namba_ya_simu !== undefined) {
      const phone = String(body.namba_ya_simu).trim();
      if (phone && !/^\+?[\d\s-]{6,}$/.test(phone)) fail(m, 400, "invalid_phone");
      user.namba_ya_simu = phone;
    }
    if (body.barua_pepe !== undefined) {
      const email = String(body.barua_pepe).trim().toLowerCase();
      if (!/.+@.+\..+/.test(email)) fail(m, 400, "invalid_email");
      if (db.interviewees.some((u) => u.barua_pepe === email && u.id !== user.id)) fail(m, 409, "email_taken");
      user.barua_pepe = email;
    }

    const eduFields = ["kiwango_cha_elimu", "sekta", "taaluma", "utaalamu", "uzoefu"];
    const touchesEducation = eduFields.some((f) => body[f] !== undefined) || body.ujuzi !== undefined;
    if (touchesEducation) {
      if (body.kiwango_cha_elimu !== undefined) user.kiwango_cha_elimu = body.kiwango_cha_elimu;
      if (body.sekta !== undefined) user.sekta = body.sekta;
      if (body.taaluma !== undefined) user.taaluma = body.taaluma;
      if (body.utaalamu !== undefined) user.utaalamu = String(body.utaalamu).trim();
      if (body.uzoefu !== undefined) user.uzoefu = body.uzoefu;
      if (body.ujuzi !== undefined) {
        const skills = Array.isArray(body.ujuzi) ? body.ujuzi.filter((s) => typeof s === "string" && s.trim()) : [];
        if (skills.length > 5) fail(m, 400, "invalid_skills_count");
        user.ujuzi = skills;
      }
      user.onboarding_step = Math.max(user.onboarding_step, 3);
    }

    return ok(m, { user: { ...user, type: "interviewee" } });
  }],

  // Interviewer: company details, personal details, and an optional password
  // change (empty string = keep current). Personal email must stay distinct
  // from the company email — same rule as signup.
  ["put", /^\/interviewer\/account$/, (m, body, config) => {
    const iv = currentInterviewer(config);
    if (!iv) fail(m, 404, "not_found");

    if (body.jina !== undefined) {
      const jina = String(body.jina).trim();
      if (jina.length < 2) fail(m, 400, "invalid_name");
      iv.jina = jina;
    }
    if (body.jina_la_kampuni !== undefined) {
      const company = String(body.jina_la_kampuni).trim();
      if (company.length < 2) fail(m, 400, "invalid_company");
      iv.jina_la_kampuni = company;
    }
    if (body.barua_pepe_ya_kampuni !== undefined) {
      const email = String(body.barua_pepe_ya_kampuni).trim().toLowerCase();
      if (!/.+@.+\..+/.test(email)) fail(m, 400, "invalid_email");
      iv.barua_pepe_ya_kampuni = email;
    }
    if (body.barua_pepe_binafsi !== undefined) {
      const email = String(body.barua_pepe_binafsi).trim().toLowerCase();
      if (!/.+@.+\..+/.test(email)) fail(m, 400, "invalid_email");
      if (email === iv.barua_pepe_ya_kampuni.toLowerCase()) fail(m, 400, "personal_email_must_differ_from_company_email");
      if (db.interviewers.some((u) => u.barua_pepe_binafsi === email && u.id !== iv.id)) fail(m, 409, "email_taken");
      iv.barua_pepe_binafsi = email;
    }
    if (body.nenosiri != null && body.nenosiri !== "") {
      const pw = String(body.nenosiri);
      if (pw.length < 8 || !/\d/.test(pw)) fail(m, 400, "weak_password");
      iv.nenosiri = pw;
    }

    return ok(m, { user: { ...iv, type: "interviewer" } });
  }],
];

function campName(interviewerId) {
  return db.interviewers.find((i) => i.id === interviewerId)?.jina_la_kampuni || "Company";
}

// ---------------------------------------------------------------------------
// Axios adapter entry point
// ---------------------------------------------------------------------------

export async function handleMockRequest(config) {
  await sleep(90 + Math.random() * 140); // a touch of network realism
  const method = (config.method || "get").toLowerCase();
  const url = (config.url || "").split("?")[0];
  const body = parseBody(config);

  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue;
    const params = url.match(pattern);
    if (!params) continue;
    const result = handler(config, body, config, params.slice(1));
    saveDb(db); // persist every mutation
    return result;
  }
  saveDb(db);
  return fail(config, 404, `no_mock_route: ${method.toUpperCase()} ${url}`);
}
