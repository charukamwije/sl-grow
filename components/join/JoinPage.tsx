"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { useSession } from "@/contexts/session-context";
import { OPEN_STATUSES } from "@/lib/certification/status";
import type { OwnApplication } from "@/lib/certifications-server";
import { CERT_TRACKS, getTrack, lessonCount, type CertTrack } from "@/lib/data/certifications";
import { completedModules, firstOpenModule, isCourseComplete } from "@/lib/course-progress";
import { deviceLearning, useDeviceHistory } from "@/lib/device-history";
import GoogleIcon from "../icons/GoogleIcon";
import Loading from "../icons/Loading";
import Reveal from "../landing/Reveal";
import TextField from "../ui/TextField";
import { btnPrimary, card, eyebrow, heading, subheading } from "../ui/styles";
import ApplicationList, { ApplicationItem } from "./ApplicationList";
import DigitalBadge from "./DigitalBadge";

type ApplicationDetails = {
  name: string;
  phone: string;
  location: string;
  notes: string;
};

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

/** Learn: the course's modules, with where the learner is up to */
function CourseOverview({ track }: { track: CertTrack }) {
  const { t, l } = useLanguage();
  const learning = useDeviceHistory(deviceLearning);
  const done = completedModules(learning, track);
  const complete = isCourseComplete(learning, track);
  const started = done.size > 0;
  const resume = firstOpenModule(learning, track) + 1;

  return (
    <div className="space-y-4">
      <p className="text-base text-gray-700">{t("course.intro")}</p>
      <p className="text-xs font-medium text-gray-500">
        {t("course.summary", { modules: track.modules.length, lessons: lessonCount(track) })}
      </p>

      <ol className="space-y-2">
        {track.modules.map((module, i) => (
          <li
            key={module.id}
            className={`flex items-center gap-4 rounded-2xl p-4 ${done.has(module.id) ? "bg-emerald-50" : "bg-gray-50"}`}
          >
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {module.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {t("course.module", { n: i + 1 })}
              </p>
              <p className="font-semibold text-gray-900">{l(module.title)}</p>
              <p className="text-xs text-gray-500">{t("course.lessonsCount", { n: module.lessons.length })}</p>
            </div>
            {done.has(module.id) && (
              <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-600" aria-label="✓" />
            )}
          </li>
        ))}
      </ol>

      {complete && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          {t("course.completed")}
        </p>
      )}

      <Link
        href={`/join/${track.id}/learn${started && !complete ? `?module=${resume}` : ""}`}
        className={`${btnPrimary} w-full !py-4 text-base sm:w-auto`}
      >
        📚 {complete ? t("course.review") : started ? t("course.continue") : t("course.start")}
      </Link>
    </div>
  );
}

/** Apply: the practical requirements and the application, once Learn is done */
/** Guests see this in place of the form: applications live in an account */
function SignInToApply() {
  const { t } = useLanguage();
  const { accountsEnabled } = useSession();
  const { signInWithGoogle, loadingProvider, isAuthLoading } = useAuth();

  if (!accountsEnabled) {
    return <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{t("join.unavailable")}</p>;
  }

  return (
    <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
      <p className="font-semibold text-gray-900">{t("join.signInTitle")}</p>
      <p className="text-sm leading-relaxed text-gray-600">{t("join.signInText")}</p>
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={isAuthLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm transition hover:shadow-md disabled:opacity-60"
      >
        {loadingProvider === "google" ? <Loading size="small" color="black" /> : <GoogleIcon />}
        {t("signInGoogle")}
      </button>
    </div>
  );
}

/**
 * Apply (FR-J-04): signed-in users send their application to the team, who
 * move it through its status. One open application per path at a time.
 */
function Apply({
  track,
  details,
  setDetails,
  applications,
}: {
  track: CertTrack;
  details: ApplicationDetails;
  setDetails: (update: (prev: ApplicationDetails) => ApplicationDetails) => void;
  applications: OwnApplication[];
}) {
  const { t, l } = useLanguage();
  const router = useRouter();
  const { user } = useSession();
  const { addErrorNotification } = useNotification();
  const [sentRef, setSentRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const open = applications.find(
    (application) => application.track === track.id && OPEN_STATUSES.includes(application.status)
  );

  const update = (field: keyof ApplicationDetails) => (value: string) =>
    setDetails((prev) => ({ ...prev, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    if (!details.name.trim() || !details.phone.trim() || !details.location.trim()) {
      addErrorNotification(t("join.needDetails"));
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: track.id, ...details }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 409) {
        addErrorNotification(t(data?.error === "certified" ? "join.alreadyCertified" : "join.alreadyOpen"));
        router.refresh();
        return;
      }
      if (!response.ok || !data?.success) throw new Error(data?.error || "Application failed");

      setSentRef(data.ref);
      setCopied(false);
      // Brings the new application into the lists from the server
      router.refresh();
    } catch (error) {
      console.error("Application error:", error);
      addErrorNotification(t("join.sendFailed"));
    } finally {
      setSending(false);
    }
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

      {!user ? (
        <SignInToApply />
      ) : open ? (
        !sentRef && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{t("join.alreadyOpen")}</p>
            <ul>
              <ApplicationItem application={open} />
            </ul>
          </div>
        )
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <p className="text-xs text-gray-500">{t("join.recommendCourse")}</p>
          <TextField id={`${track.id}-name`} label={t("checkout.name")} value={details.name} onChange={update("name")} autoComplete="name" maxLength={120} required />
          <TextField id={`${track.id}-phone`} type="tel" label={t("checkout.phone")} value={details.phone} onChange={update("phone")} autoComplete="tel" maxLength={40} required />
          <TextField id={`${track.id}-location`} label={t("join.location")} value={details.location} onChange={update("location")} autoComplete="address-level2" maxLength={120} required />
          <TextField id={`${track.id}-notes`} label={t("join.aboutMe")} value={details.notes} onChange={update("notes")} maxLength={1000} multiline rows={3} />
          <button type="submit" className={`${btnPrimary} w-full py-3.5`} disabled={sending}>
            {sending && <Loading size="small" color="white" />}
            {sending ? t("join.sending") : t("join.submit")}
          </button>
          <p className="text-xs text-gray-500">{t("join.privacy")}</p>
        </form>
      )}
    </div>
  );
}

/** One path from start to badge: Learn, Apply, Get certified */
function Journey({ track, applications }: { track: CertTrack; applications: OwnApplication[] }) {
  const { t, l } = useLanguage();
  const { user } = useSession();
  const learning = useDeviceHistory(deviceLearning);
  const passed = isCourseComplete(learning, track);
  const [details, setDetails] = useState<ApplicationDetails>({
    name: user?.displayName ?? "",
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
          <CourseOverview track={track} />
        </div>

        <div className="space-y-4 border-t border-black/5 pt-8">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <h3 className={`${subheading} !mb-0`}>{t("join.applyTitle")}</h3>
          </div>
          <Apply track={track} details={details} setDetails={setDetails} applications={applications} />
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

type JoinPageProps = {
  initialPath?: CertTrack["id"];
  /** The signed-in user's applications, newest first; empty for guests */
  applications?: OwnApplication[];
};

export default function JoinPage({ initialPath, applications = [] }: JoinPageProps) {
  const { t, l } = useLanguage();
  const [selected, setSelected] = useState<CertTrack["id"]>(initialPath ?? "home-grower");
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
        <Journey key={track.id} track={track} applications={applications} />
      </section>

      {applications.length > 0 && (
        <section className={card}>
          <h2 className={subheading}>{t("join.yourApplications")}</h2>
          <ApplicationList applications={applications} />
        </section>
      )}

      <p className="rounded-2xl bg-gray-100 p-4 text-xs leading-relaxed text-gray-600">{t("join.note")}</p>
    </div>
  );
}
