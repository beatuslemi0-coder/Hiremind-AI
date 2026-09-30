import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import { prefersReducedMotion } from "../lib/motionUtils";
import splash from "../assets/splash.jpg";
import sessionArt from "../assets/interview-session.png";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, useGSAP);

const shell = "mx-auto w-full max-w-[1200px] px-6";

const NAV_LINKS = [
  { key: "features", href: "#features" },
  { key: "testimonials", href: "#testimonials" },
  { key: "objections", href: "#faq" },
];

/*
 * GSAP typewriter: types phrases one character at a time, pauses, deletes,
 * and moves to the next phrase in an endless cycle. Blinking caret included.
 * Returns a cleanup function that kills everything it created.
 */
function createTypewriter(el, phrases) {
  const caret = document.createElement("span");
  caret.className = "type-caret";
  el.appendChild(caret);
  const textEl = el.querySelector(".type-text");

  const state = { i: 0, j: 0, deleting: false, killed: false };
  let tween = null;

  const step = () => {
    if (state.killed) return;
    const phrase = phrases[state.i % phrases.length];
    let delay = 55;

    if (!state.deleting) {
      state.j += 1;
      textEl.textContent = phrase.slice(0, state.j);
      if (state.j === phrase.length) {
        delay = 2000; // hold the full phrase
        state.deleting = true;
      }
    } else {
      state.j -= 1;
      textEl.textContent = phrase.slice(0, state.j);
      if (state.j === 0) {
        delay = 350; // beat before the next phrase
        state.deleting = false;
        state.i += 1;
      } else {
        delay = 28; // deleting is faster than typing
        if (Math.random() < 0.06) delay = 90; // tiny human jitter
      }
  }

    tween = gsap.delayedCall(delay / 1000, step);
  };

  textEl.textContent = "";
  tween = gsap.delayedCall(0.4, step);

  const caretBlink = gsap.to(caret, {
    autoAlpha: 0,
    duration: 0.45,
    repeat: -1,
    yoyo: true,
    ease: "steps(1)",
  });

  return () => {
    state.killed = true;
    tween?.kill();
    caretBlink.kill();
    caret.remove();
  };
}

/* Hero — reference layout: headline left, animated session card right. */
function Hero() {
  const { t, i18n } = useTranslation();
  const root = useRef(null);
  const h1El = useRef(null);

  /* Typewriter headline: types, holds, deletes, cycles phrases.
     Re-created on language switch so the phrases follow the locale. */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (!h1El.current) return;
      const phrases = t("landing.hero.typedPhrases", { returnObjects: true });
      return createTypewriter(h1El.current, phrases);
    },
    { scope: root, dependencies: [i18n.language] }
  );

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(h1El.current, { autoAlpha: 0, duration: 0.2 }, 0)
        .from(".hero-sub", { y: 20, autoAlpha: 0, duration: 0.55 }, 0.15)
        .from(".hero-ctas", { y: 18, autoAlpha: 0, duration: 0.5 }, "-=0.3")
        .from(".hero-proof", { autoAlpha: 0, duration: 0.6 }, "-=0.2")
        .from(
          ".hero-card",
          { y: 44, autoAlpha: 0, rotateX: -6, duration: 0.85, ease: "power3.out" },
          0.25
        );

      /* Parallax the whole hero away on scroll */
      gsap.to(".hero-inner", {
        yPercent: 14,
        autoAlpha: 0.3,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(48rem 32rem at 12% 0%, rgba(255,255,255,0.05), transparent 62%), radial-gradient(44rem 30rem at 88% 8%, rgba(255,255,255,0.04), transparent 64%)",
        }}
      />
      <div className={`${shell} relative pb-20 pt-14 sm:pt-20`}>
        <div className="hero-inner grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 ref={h1El} className="hero-headline min-h-[2.1em] max-w-xl text-balance text-5xl font-extrabold leading-[1.02] tracking-tighter text-on-surface sm:text-6xl lg:text-[4.2rem]">
              <span className="type-text">{t("landing.hero.headline")}</span>
            </h1>
            <p className="hero-sub mt-6 max-w-lg text-pretty text-lg leading-8 text-on-surface-variant">
              {t("landing.hero.subheadline")}
            </p>
            <div className="hero-ctas mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/interviewee/profile"
                className="gbtn gbtn-pulse group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-elev-3 transition"
              >
                {t("landing.hero.candidate")}
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/interviewer/company-profile"
                className="gbtn-ghost inline-flex items-center gap-2 rounded-full border border-primary/25 bg-black/40 px-6 py-3.5 text-sm font-semibold text-on-surface backdrop-blur-md transition dark:border-white/15 dark:bg-white/[0.06] dark:hover:text-white"
              >
                {t("landing.hero.employer")}
              </Link>
            </div>
            <p className="hero-proof mt-8 text-sm font-semibold text-on-surface-variant">
              {t("landing.hero.rating")}
            </p>
          </div>

          {/* The session card is the artwork itself — no overlaid content */}
          <div className="hero-card relative overflow-hidden rounded-3xl">
            <img
              src={sessionArt}
              alt="Live AI interview session with real-time analysis"
              className="block h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}/* Band 2 — dual testimonial marquee: two rows of small cards drifting
   continuously, top row right-to-left, bottom row left-to-right. Each row
   renders its stories twice for a seamless loop; CSS drives the drift
   (compositor-cheap), hover pauses, reduced motion freezes it. */
function Band() {
  const { t } = useTranslation();
  const items = t("landing.testimonials.items", { returnObjects: true }) || [];
  const root = useRef(null);
  const [paused, setPaused] = useState(false);

  /* Split the 10 stories across the two rows (5 + 5). */
  const half = Math.ceil(items.length / 2);
  const rowA = items.slice(0, half);
  const rowB = items.slice(half);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".band-title", {
        y: 32,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
      });
    },
    { scope: root }
  );

  const Row = ({ stories, direction }) => (
    <div className="band-row overflow-hidden">
      <div className={`band-track band-track--${direction} ${paused ? "band-track--paused" : ""}`}>
        {[0, 1].map((copy) => (
          <div className="band-copy" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
            {stories.map((item) => (
              <figure className="band-card lglass p-5 w-[300px] shrink-0 sm:w-[330px]" key={item.name}>
                <blockquote className="text-balance text-sm font-semibold leading-relaxed text-on-surface">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="lchip flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-black">
                    {item.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-on-surface">{item.name}</p>
                    <p className="truncate text-[11px] text-on-surface-variant">{item.role}</p>
                  </div>
                  <span className="abadge-gold ml-auto shrink-0 text-[10px]">{item.result}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section ref={root} id="testimonials" className="ldivider">
      <div className={`${shell} py-20 sm:py-28`}>
        <h2 className="band-title gtext mx-auto max-w-2xl text-balance text-center text-4xl font-extrabold leading-[1.06] tracking-tighter text-on-surface sm:text-5xl">
          {t("landing.band.title")}
        </h2>

        <div
          className="band-stage mt-12 space-y-4 [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Row stories={rowA} direction="rtl" />
          <Row stories={rowB} direction="ltr" />
        </div>
      </div>
    </section>
  );
}

/* Features / "4 reasons" — centered heading, numbered glass cards.
   Each card carries a cursor-tracking spotlight: one delegated pointermove
   listener writes --mx/--my (px) on whichever card the pointer is over. */
function Features() {
  const { t } = useTranslation();
  const items = t("landing.features.items", { returnObjects: true });
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.set(".feature-card", { autoAlpha: 0, y: 44, rotateX: -8 });
      ScrollTrigger.batch(".feature-card", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.1,
          }),
      });

      /* Spotlight: skipped on touch (no hover to track). */
      if (window.matchMedia("(hover: none)").matches) return;
      const grid = root.current.querySelector(".feature-grid");
      if (!grid) return;
      const move = (e) => {
        const card = e.target.closest(".feature-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      grid.addEventListener("pointermove", move);
      return () => grid.removeEventListener("pointermove", move);
    },
    { scope: root }
  );

  return (
    <section ref={root} id="features" className="ldivider">
      <div className={`${shell} py-20 sm:py-28`}>
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <h2 className="gtext text-balance text-4xl font-extrabold leading-[1.06] tracking-tighter text-on-surface sm:text-5xl">
            {t("landing.features.title")}
          </h2>
        </div>
        <div className="feature-grid mt-14 grid gap-5 [perspective:1200px] sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 4).map((item, i) => (
            <div key={item.title} className="feature-card lglass lglass-hover p-7">
              <span className="spotlight" aria-hidden="true" />
              <span className="gnum text-5xl font-extrabold tracking-tight">
                {i + 1}
              </span>
              <p className="mt-4 text-base font-bold leading-6 text-on-surface">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* FAQ — GSAP height accordion (kept: user-triggered motion). */
function Objections() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(0);
  const items = t("landing.objections.items", { returnObjects: true });
  const answersRef = useRef([]);

  useGSAP(
    () => {
      answersRef.current.forEach((el, i) => {
        if (!el) return;
        const isOpen = i === open;
        gsap.to(el, {
          height: isOpen ? "auto" : 0,
          autoAlpha: isOpen ? 1 : 0,
          duration: 0.38,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      });
    },
    { dependencies: [open] }
  );

  return (
    <section id="faq" className="ldivider">
      <div className={`${shell} py-20 sm:py-28`}>
        <div className="mx-auto max-w-3xl space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.concern} className={`lglass overflow-hidden ${isOpen ? "border-primary/30" : ""}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-base font-bold tracking-tight text-on-surface sm:text-lg">{item.concern}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                      isOpen
                        ? "faq-open border-primary/40 bg-primary text-black"
                        : "border-primary/20 text-on-surface-variant"
                    }`}
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <div
                  ref={(el) => (answersRef.current[i] = el)}
                  className="overflow-hidden"
                  style={{ height: i === 0 ? "auto" : 0 }}
                >
                  <p className="border-t border-primary/10 px-6 py-5 text-sm leading-7 text-on-surface-variant dark:border-white/10">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* Contact band — reference layout: headline left, email form right. */
function Contact() {
  const { t } = useTranslation();
  const root = useRef(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        defaults: { ease: "power3.out" },
      });
      tl.from(".contact-title", { y: 30, autoAlpha: 0, duration: 0.65 })
        .from(".contact-link", { y: 14, autoAlpha: 0, duration: 0.45 }, "-=0.3")
        .from(".contact-form", { x: 26, autoAlpha: 0, duration: 0.55 }, "-=0.35")
        .from(".contact-form > *", { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.07 }, "-=0.25");
    },
    { scope: root }
  );

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({ type: "error", message: t("landing.newsletter.invalid") });
      return;
    }
    setStatus({ type: "success", message: t("landing.newsletter.success") });
    setEmail("");
  }

  return (
    <section ref={root} className="ldivider">
      <div className={`${shell} py-20 sm:py-24`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="contact-title gtext max-w-md text-balance text-4xl font-extrabold leading-[1.06] tracking-tighter text-on-surface sm:text-5xl">
              {t("landing.finalCta.title")}
            </h2>
            <Link
              to="/interviewee/profile"
              className="contact-link glink group mt-7 inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition hover:text-primary dark:hover:text-white"
            >
              {t("landing.finalCta.candidate")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="contact-form flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("landing.footer.emailAddress")}
              className="rounded-full border border-primary/15 bg-black/40 px-5 py-3.5 text-sm text-on-surface backdrop-blur-md transition placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none dark:border-white/15 dark:bg-white/[0.06]"
              aria-label={t("landing.footer.emailAddress")}
            />
            <input
              type="text"
              placeholder={t("landing.footer.role")}
              className="rounded-full border border-primary/15 bg-black/40 px-5 py-3.5 text-sm text-on-surface backdrop-blur-md transition placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none dark:border-white/15 dark:bg-white/[0.06]"
              aria-label={t("landing.footer.role")}
            />
            <textarea
              rows={3}
              placeholder={t("landing.showcase.caption")}
              className="resize-none rounded-3xl border border-primary/15 bg-black/40 px-5 py-3.5 text-sm text-on-surface backdrop-blur-md transition placeholder:text-on-surface-variant focus:border-primary/50 focus:outline-none dark:border-white/15 dark:bg-white/[0.06]"
              aria-label={t("landing.showcase.caption")}
            />
            <button
              type="submit"
              className="gbtn whitespace-nowrap rounded-full px-5 py-3.5 text-sm font-semibold text-white shadow-elev-2 transition"
            >
              {t("landing.footer.subscribe")}
            </button>
            {status.message && (
              <p className={`text-xs ${status.type === "error" ? "text-error" : "text-success"}`} role="status">
                {status.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

/* Footer — thin, single row, like the reference. */
function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="ldivider">
      <div className={`${shell} py-8`}>
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2.5">
            <span className="logo-tile flex h-7 w-7 items-center justify-center rounded-lg bg-night-crimson text-[11px] font-extrabold text-white">
              Z
            </span>
            <span className="text-xs font-bold tracking-tight text-on-surface">{t("nav.app_name")}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            <a href="#features" className="transition hover:text-primary dark:hover:text-white">
              {t("landing.nav.features")}
            </a>
            <a href="#testimonials" className="transition hover:text-primary dark:hover:text-white">
              {t("landing.nav.testimonials")}
            </a>
            <a href="#faq" className="transition hover:text-primary dark:hover:text-white">
              {t("landing.nav.objections")}
            </a>
          </nav>
          <span className="max-w-xs text-right">{t("landing.footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const [navOpen, setNavOpen] = useState(false);
  const root = useRef(null);

  /* Smooth scrolling on the landing page only. */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.1,
        effects: true,
      });
      return () => smoother.kill();
    },
    { scope: root }
  );

  /* Header: hide on scroll down, show + elevate on scroll up. */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const header = document.querySelector(".lnav");
      if (!header) return;
      let lastY = 0;
      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll();
          header.classList.toggle("is-scrolled", y > 24);
          if (y > lastY && y > 140 && !navOpen) {
            gsap.to(header, { yPercent: -100, duration: 0.35, ease: "power2.out" });
          } else {
            gsap.to(header, { yPercent: 0, duration: 0.35, ease: "power2.out" });
          }
          lastY = y;
        },
      });
    },
    [navOpen]
  );

  return (
    <div ref={root} className="night landing-night min-h-screen text-on-surface transition-colors duration-300">
      {/* Full-page night backdrop: splash photo + purple veil, behind everything */}
      <div className="night-bg" aria-hidden="true" />
      <div className="night-veil" aria-hidden="true" />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <header className="lnav sticky top-0 z-50">
            <div className="lglass !rounded-none border-x-0 border-t-0">
              <div className={`${shell} flex h-16 items-center justify-between gap-4`}>
                <Link to="/" className="flex items-center gap-2.5">
                  <span className="logo-tile flex h-9 w-9 items-center justify-center rounded-xl bg-night-crimson text-sm font-extrabold text-white shadow-elev-1">
                    AI
                  </span>
                  <span className="text-sm font-bold tracking-tight text-on-surface">{t("nav.app_name")}</span>
                </Link>

                <nav className="hidden items-center gap-1 lg:flex">
                  {NAV_LINKS.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      className="rounded-full px-3.5 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-primary/[0.07] hover:text-primary dark:hover:text-white"
                    >
                      {t(`landing.nav.${item.key}`)}
                    </a>
                  ))}
                </nav>

                <div className="flex items-center gap-2">
                <div className="hidden sm:flex sm:items-center sm:gap-1.5">
                  <LanguageToggle />
                </div>
                  <Link
                    to="/login"
                    className="hidden text-sm font-semibold text-on-surface-variant transition hover:text-primary sm:block dark:hover:text-white"
                  >
                    {t("landing.nav.login")}
                  </Link>
                  <Link
                    to="/interviewee/profile"
                    className="gbtn gbtn-pulse hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-elev-2 transition sm:inline-flex"
                  >
                    {t("landing.nav.getStarted")}
                  </Link>
                  <button
                    type="button"
                    aria-label={t("landing.nav.menu")}
                    onClick={() => setNavOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-black/40 text-on-surface backdrop-blur-md transition hover:border-primary/40 lg:hidden dark:border-white/15 dark:bg-white/[0.06]"
                  >
                    {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {navOpen && (
                <div className={`${shell} border-t border-primary/10 pb-5 pt-4 lg:hidden dark:border-white/10`}>
                  <nav className="flex flex-col gap-1">
                    {NAV_LINKS.map((item) => (
                      <a
                        key={item.key}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-on-surface-variant transition hover:bg-primary/[0.07] hover:text-primary"
                      >
                        {t(`landing.nav.${item.key}`)}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-4 flex items-center gap-2">
                    <LanguageToggle />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to="/login"
                      className="rounded-full border border-primary/20 px-4 py-2.5 text-center text-sm font-semibold text-on-surface"
                    >
                      {t("landing.nav.login")}
                    </Link>
                    <Link
                      to="/interviewee/profile"
                      className="gbtn rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white"
                    >
                      {t("landing.nav.getStarted")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main>
            <Hero />
            <Band />
            <Features />
            <Objections />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
