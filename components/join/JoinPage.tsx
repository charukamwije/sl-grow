"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, LockClosedIcon, XCircleIcon } from "@heroicons/react/20/solid";
import { ArrowTopRightOnSquareIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { CERT_TRACKS, getTrack, type CertTrack } from "@/lib/data/certifications";
import {
  deviceApplications,
  deviceLearning,
  useDeviceHistory,
} from "@/lib/device-history";
import { generateApplicationRef } from "@/lib/order/reference";
import {
  buildApplicationMessage,
  waLink,
  type ApplicationDetails,
} from "@/lib/order/whatsapp";
import Reveal from "../landing/Reveal";
import TextField from "../ui/TextField";
import { btnPrimary, card, eyebrow, heading, subheading } from "../ui/styles";
import DigitalBadge from "./DigitalBadge";

const sectionTitle = "text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl";

const STEPS = [
  { title: "join.step1", text: "join.step1Text", icon: "📚" },
  { title: "join.step2", text: "join.step2Text", icon: "📝" },
  { title: "join.step3", text: "join.step3Text", icon: "🏅" },
] as const;

function StepNumber({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? "bg-emerald-600 text-white" : "bg-gray-900 text-white"
      }`}
    >
      {done ? <CheckCircleIcon className="h-5 w-5" aria-hidden="true" /> : n}
    </span>
  );
}

/** Learn: the lessons, then a knowledge check that unlocks Apply */
function Learn({ track, passed }: { track: CertTrack; passed: boolean }) {
  const { t, l } = useLanguage();
  const { addErrorNotification } = useNotification();
  const [answers, setAnswers] = useState<(number | null)[]>(() => track.quiz.map(() => null));
  const [checked, setChecked] = useState(false);

  const score = track.quiz.filter((q, i) => answers[i] === q.answer).length;

  const check = () => {
    if (answers.some((answer) => answer === null)) {
      addErrorNotification(t("join.quizIncomplete"));
      return;
    }
    setChecked(true);
    if (score === track.quiz.length && !passed) {
      deviceLearning.add({ track: track.id, passedAt: new Date().toISOString() });
    }
  };

  return (
    <div className="space-y-5">
      <ol className="space-y-3">
        {track.lessons.map((lesson, i) => (
          <li key={i} className="rounded-2xl bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {i + 1}. {l(lesson.title)}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{l(lesson.text)}</p>
              </div>
              {lesson.href && (
                <Link
                  href={lesson.href}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  {t("join.openGuide")}
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-black/5 p-4 sm:p-5">
        <h4 className="font-semibold text-gray-900">🧠 {t("join.quizTitle")}</h4>
        {passed ? (
          <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            {t("join.quizPassed")}
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-gray-600">{t("join.quizIntro")}</p>
            <div className="mt-4 space-y-5">
              {track.quiz.map((q, qi) => (
                <fieldset key={qi}>
                  <legend className="mb-2 text-sm font-medium text-gray-900">
                    {qi + 1}. {l(q.question)}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {q.options.map((option, oi) => {
                      const chosen = answers[qi] === oi;
                      const wrong = checked && chosen && oi !== q.answer;
                      return (
                        <label
                          key={oi}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                            wrong
                              ? "bg-red-50 text-red-900 ring-1 ring-red-200"
                              : chosen
                                ? "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500"
                                : "bg-gray-50 text-gray-700 ring-1 ring-transparent hover:ring-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`${track.id}-q${qi}`}
                            checked={chosen}
                            onChange={() => {
                              setChecked(false);
                              setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
                            }}
                            className="sr-only"
                          />
                          {wrong ? (
                            <XCircleIcon className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                                chosen ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                              }`}
                            />
                          )}
                          {l(option)}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            {checked && score < track.quiz.length && (
              <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                {t("join.quizRetry", { n: score, total: track.quiz.length })}
              </p>
            )}
            <button type="button" onClick={check} className={`${btnPrimary} mt-4`}>
              {t("join.check")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Apply: the practical requirements and the application, once Learn is done */
function Apply({
  track,
  unlocked,
  details,
  setDetails,
}: {
  track: CertTrack;
  unlocked: boolean;
  details: ApplicationDetails;
  setDetails: (update: (prev: ApplicationDetails) => ApplicationDetails) => void;
}) {
  const { t, l } = useLanguage();
  const { addErrorNotification, addInfoNotification } = useNotification();
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (field: keyof ApplicationDetails) => (value: string) =>
    setDetails((prev) => ({ ...prev, [field]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!details.name.trim() || !details.phone.trim() || !details.location.trim()) {
      addErrorNotification(t("join.needDetails"));
      return;
    }

    const ref = generateApplicationRef();
    const score = `${track.quiz.length}/${track.quiz.length}`;
    // Opened inside the click so mobile popup blockers allow it
    window.open(waLink(buildApplicationMessage(track.name.en, details, ref, score)), "_blank", "noopener");
    deviceApplications.add({ ref, track: track.id, createdAt: new Date().toISOString() });
    addInfoNotification(t("orderOpened"));
    setSentRef(ref);
    setCopied(false);
  };

  const copy = async () => {
    if (!sentRef) return;
    try {
      await navigator.clipboard.writeText(sentRef);
      setCopied(true);
    } catch {
      // Clipboard blocked: the reference is on screen to copy by hand
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-700">{t("join.applyIntro")}</p>
        <ul className="mt-2 space-y-2">
          {track.requirements.map((requirement, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              {l(requirement)}
            </li>
          ))}
        </ul>
      </div>

      {!unlocked ? (
        <p className="flex items-center gap-2 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <LockClosedIcon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          {t("join.applyLocked")}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          {sentRef && (
            <div role="status" className="animate-fade-up rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                {t("join.sentTitle")}
              </p>
              <p className="mt-3 text-xs font-medium text-emerald-800">{t("join.refLabel")}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-gray-900">{sentRef}</span>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-800">{t("join.refHint")}</p>
            </div>
          )}
          <TextField id={`${track.id}-name`} label={t("checkout.name")} value={details.name} onChange={update("name")} autoComplete="name" maxLength={200} required />
          <TextField id={`${track.id}-phone`} type="tel" label={t("checkout.phone")} value={details.phone} onChange={update("phone")} autoComplete="tel" maxLength={200} required />
          <TextField id={`${track.id}-location`} label={t("join.location")} value={details.location} onChange={update("location")} autoComplete="address-level2" maxLength={200} required />
          <TextField id={`${track.id}-notes`} label={t("join.aboutMe")} value={details.notes} onChange={update("notes")} maxLength={1000} multiline rows={3} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5a] active:scale-[0.98]"
          >
            💬 {t("join.send")}
          </button>
          <p className="text-xs text-gray-500">{t("checkout.privacy")}</p>
        </form>
      )}
    </div>
  );
}

/** One path from start to badge: Learn, Apply, Get certified */
function Journey({ track }: { track: CertTrack }) {
  const { t, l } = useLanguage();
  const learning = useDeviceHistory(deviceLearning);
  const passed = learning.some((entry) => entry.track === track.id);
  const [details, setDetails] = useState<ApplicationDetails>({
    name: "",
    phone: "",
    location: "",
    notes: "",
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${card} lg:col-span-2 space-y-8`}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StepNumber n={1} done={passed} />
            <h3 className={`${subheading} !mb-0`}>{t("join.learnTitle")}</h3>
          </div>
          <Learn track={track} passed={passed} />
        </div>

        <div className="space-y-4 border-t border-black/5 pt-8">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <h3 className={`${subheading} !mb-0`}>{t("join.applyTitle")}</h3>
          </div>
          <Apply track={track} unlocked={passed} details={details} setDetails={setDetails} />
        </div>
      </section>

      <aside className={`${card} space-y-4 lg:sticky lg:top-24 lg:self-start`}>
        <div className="flex items-center gap-3">
          <StepNumber n={3} />
          <h3 className={`${subheading} !mb-0`}>{t("join.certTitle")}</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">{t("join.certText")}</p>
        <figure className="rounded-2xl bg-gradient-to-b from-gray-50 to-white p-4 text-center ring-1 ring-black/5">
          <DigitalBadge track={track} className="mx-auto w-44" />
          <figcaption className="mt-3 space-y-0.5">
            <p className="text-xs uppercase tracking-wider text-gray-400">{t("join.badgePreview")}</p>
            <p className="font-semibold text-gray-900">{details.name.trim() || t("join.yourName")}</p>
            <p className="text-sm text-gray-600">{l(track.name)}</p>
            <p className="font-mono text-xs text-gray-400">ASW-C-••••••</p>
          </figcaption>
        </figure>
      </aside>
    </div>
  );
}

export default function JoinPage() {
  const { t, l } = useLanguage();
  const [selected, setSelected] = useState<CertTrack["id"]>("home-grower");
  const applications = useDeviceHistory(deviceApplications);
  const track = getTrack(selected)!;

  const choose = (id: CertTrack["id"]) => {
    setSelected(id);
    document.getElementById("journey")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* Hero */}
      <section className="relative isolate -mt-6 pb-4 pt-10 md:-mt-8 sm:pt-16">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 bg-gradient-to-b from-amber-50 via-emerald-50 to-[var(--background)]"
        />
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <p className={`${eyebrow} inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-black/5`}>
              🏅 {t("join.badge")}
            </p>
            <h1 className={`${heading} animate-fade-up !text-4xl leading-tight [animation-delay:100ms] sm:!text-5xl lg:!text-6xl`}>
              {t("join.title")}
            </h1>
            <p className="max-w-xl animate-fade-up text-lg leading-relaxed text-gray-600 [animation-delay:200ms]">
              {t("join.intro")}
            </p>
            <a href="#paths" className={`${btnPrimary} animate-fade-up !px-6 !py-3.5 text-base [animation-delay:300ms]`}>
              {t("join.cta")} ↓
            </a>
          </div>

          {/* The three badges, fanned out in 3D */}
          <div className="flex items-center justify-center [perspective:1200px]" aria-hidden="true">
            {CERT_TRACKS.map((item, i) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${200 + i * 150}ms` }}
              >
                {/* Angle and float on separate elements: the float animation
                    sets its own transform */}
                <div
                  style={{
                    transform: `rotateY(${(i - 1) * -22}deg) translateZ(${i === 1 ? 60 : 0}px)`,
                  }}
                >
                  <div className="animate-float" style={{ animationDelay: `${-i * 1.5}s` }}>
                    <DigitalBadge
                      track={item}
                      className={i === 1 ? "w-36 sm:w-48" : "-mx-4 w-28 sm:w-40"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learn, Apply, Get certified */}
      <Reveal as="ol" stagger className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className={`${card} lift flex gap-4`}>
            <StepNumber n={i + 1} />
            <div>
              <h2 className="font-semibold text-gray-900">
                <span aria-hidden="true">{step.icon}</span> {t(step.title)}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{t(step.text)}</p>
            </div>
          </li>
        ))}
      </Reveal>

      {/* The paths */}
      <section id="paths" className="scroll-mt-24 space-y-6">
        <Reveal>
          <h2 className={sectionTitle}>{t("join.tracksTitle")}</h2>
        </Reveal>
        <Reveal stagger className="grid gap-4 md:grid-cols-3">
          {CERT_TRACKS.map((item) => {
            const isSelected = item.id === selected;
            return (
              <article
                key={item.id}
                className={`lift flex flex-col items-center rounded-3xl p-6 text-center transition ${
                  isSelected
                    ? "bg-white shadow-lg ring-2 ring-emerald-500"
                    : "bg-white shadow-sm ring-1 ring-black/5"
                }`}
              >
                <DigitalBadge track={item} className="w-32" shine={isSelected} />
                <h3 className="mt-4 font-semibold text-gray-900">{l(item.name)}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-600">{l(item.forWho)}</p>
                <button
                  type="button"
                  onClick={() => choose(item.id)}
                  aria-pressed={isSelected}
                  className={`mt-5 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {isSelected ? `✓ ${t("join.selected")}` : t("join.start")}
                </button>
              </article>
            );
          })}
        </Reveal>
      </section>

      {/* The chosen path, step by step */}
      <section id="journey" className="scroll-mt-24 space-y-6">
        <div className="flex items-center gap-4">
          <DigitalBadge track={track} className="w-14" shine={false} />
          <h2 className={sectionTitle}>{l(track.name)}</h2>
        </div>
        {/* Re-keyed per path, so each starts with a fresh form and quiz */}
        <Journey key={track.id} track={track} />
      </section>

      {applications.length > 0 && (
        <section className={card}>
          <h2 className={subheading}>{t("join.yourApplications")}</h2>
          <ul className="space-y-2">
            {applications.map((application) => {
              const applied = getTrack(application.track);
              return (
                <li key={application.ref} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/5 p-3 text-sm">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono font-bold tracking-wider text-emerald-800">
                    {application.ref}
                  </span>
                  <span className="text-gray-700">{applied ? l(applied.name) : application.track}</span>
                  <time dateTime={application.createdAt} className="text-xs text-gray-500">
                    {application.createdAt.slice(0, 10)}
                  </time>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="rounded-2xl bg-gray-100 p-4 text-xs leading-relaxed text-gray-600">{t("join.note")}</p>
    </div>
  );
}
