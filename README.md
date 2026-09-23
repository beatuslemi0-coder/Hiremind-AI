# AI Interview Platform — Frontend-Only Demo

React + Vite + Tailwind + react-i18next demo of the full interview-platform experience,
running **entirely in the browser** — no backend, no database, no server.

All flows work against an in-browser stateful simulator:
- **Interviewee wizard**: Profile → Email verification → Education & Skills → Documents → Matched interview list → live AI interview session → report
- **Interviewer wizard**: Company Profile → Company email verification → Personal Profile → Personal email verification → Subscription → Dashboard (postings, availability, sessions)
- **Dashboards, booking, transcripts, document review, reports** — all stateful and persisted

## How the mock layer works

- `frontend/src/api/client.js` — the single API choke point. When `VITE_USE_MOCKS=true`,
  requests are routed to the in-browser simulator instead of HTTP.
- `frontend/src/api/mockDb.js` — the simulator: fixtures + a localStorage-backed store.
  Signup, verification, login, posting, booking, sessions, reviews, and reports all
  mutate the store, so the demo behaves like a working product and survives reloads.
- Verification codes are printed to the browser console (`[mock] verification code ...`);
  in practice **any 6-digit code is accepted**.
- Demo accounts seeded in the store:
  - Interviewee (email-only sign-in): `royal.flow@example.com`
  - Interviewer (email + password): `amina@demotech.example.com` / `password123`
- Reset the demo world from the browser console: `window.__resetMockDb()` then reload.

## Setup

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```

The `.env` ships with `VITE_USE_MOCKS=true`. To point the app at a real backend later:

1. Set `VITE_USE_MOCKS=false` and `VITE_API_URL=http://localhost:4000/api` in `frontend/.env`
2. Restore the backend (it lives in git history: `git log --diff-filter=D -- backend/`)
3. `npm run dev` as before

## Notes

- Sector/profession/skills lists (`frontend/src/data/taxonomy.js`) are placeholder but
  realistic values shared by both sides — matching compares these strings for equality,
  so keep both sides consistent when replacing them.
- Swahili-default localization with full English parity, no hardcoded strings.
- The mock simulator is deliberately browser-only. It is not a server, not a database,
  and not a starting point for one — it exists so the UI can be demoed and developed
  without infrastructure.
