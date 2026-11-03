"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SpeakerWaveIcon,
  StopIcon,
} from "@heroicons/react/24/solid";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import { lessonCount, type CertTrack, type Lesson } from "@/lib/data/certifications";
import { completedModules, firstOpenModule, isCourseComplete } from "@/lib/course-progress";
import { deviceLearning, useDeviceHistory } from "@/lib/device-history";
import { useSpeech } from "@/lib/use-speech";
import { card } from "../ui/styles";
import DigitalBadge from "./DigitalBadge";
import QuizCard from "./QuizCard";

type CoursePlayerProps = {
  track: CertTrack;
  /** Where to start, e.g. the first module not yet completed */
  initialModule: number;
};

/** One lesson, shown big: picture, title, points one per line, a task */
function LessonCard({ lesson }: { lesson: Lesson }) {
  const { t, l } = useLanguage();

  return (
    <div className="animate-fade-up">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-6xl ring-8 ring-emerald-50/50 sm:h-32 sm:w-32 sm:text-7xl"
        >
          {lesson.icon}
        </span>
        <h2 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">{l(lesson.title)}</h2>
      </div>

      <ul className="mx-auto mt-6 max-w-lg space-y-3">
        {lesson.points.map((point, i) => (
          <li key={i} className="flex gap-3 text-lg leading-relaxed text-gray-800">
            <span
              aria-hidden="true"
              className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
            >
              ✓
            </span>
            {l(point)}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-6 flex max-w-lg gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
        <span aria-hidden="true" className="text-2xl">👉</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">{t("course.tryIt")}</p>
          <p className="mt-0.5 text-base text-gray-900">{l(lesson.task)}</p>
        </div>
      </div>

      {lesson.href && (
        <p className="mt-4 text-center">
          <Link href={lesson.href} className="text-sm font-semibold text-emerald-700 underline underline-offset-4">
            📖 {t("course.learnMore")}
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * A certification course: modules of short lessons, each module ending in a
 * quiz. Passing a quiz completes the module on this device; completing every
 * module unlocks the application on the Join page.
 */
export default function CoursePlayer({ track, initialModule }: CoursePlayerProps) {
  const { lang, t, l } = useLanguage();
  const { addInfoNotification } = useNotification();
  const speech = useSpeech(lang);
  const learning = useDeviceHistory(deviceLearning);
  const done = completedModules(learning, track);
  const allDone = isCourseComplete(learning, track);

  const [moduleIndex, setModuleIndex] = useState(initialModule);
  // 0..lessons-1: a lesson; lessons: the quiz; lessons + 1: module complete
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = track.modules[moduleIndex];
  const quizStep = current.lessons.length;
  const doneStep = quizStep + 1;
  const lesson = step < quizStep ? current.lessons[step] : null;

  // Overall progress through the lessons, for the bar at the top
  const total = lessonCount(track);
  const before = track.modules.slice(0, moduleIndex).reduce((sum, m) => sum + m.lessons.length, 0);
  const progress = finished ? 100 : Math.round((Math.min(before + step, total) / total) * 100);

  const goTo = (nextModule: number, nextStep: number) => {
    speech.stop();
    setFinished(false);
    setModuleIndex(nextModule);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const passQuiz = () => {
    if (!done.has(current.id)) {
      deviceLearning.add({ track: track.id, module: current.id, passedAt: new Date().toISOString() });
    }
    setStep(doneStep);
  };

  const isLastModule = moduleIndex === track.modules.length - 1;

  // After the last module, finish only if every module really is done (the
  // outline lets learners jump ahead); otherwise go back to the first gap
  const nextModule = () => {
    if (!isLastModule) {
      goTo(moduleIndex + 1, 0);
    } else if (allDone) {
      speech.stop();
      setFinished(true);
    } else {
      goTo(firstOpenModule(learning, track), 0);
    }
  };

  const listen = () => {
    if (!lesson) return;
    if (speech.speaking) {
      speech.stop();
      return;
    }
    const text = [l(lesson.title), ...lesson.points.map(l), `${t("course.tryIt")}: ${l(lesson.task)}`].join(". ");
    if (!speech.speak(text)) addInfoNotification(t("guides.noVoice"));
  };

  return (
    <div className="space-y-6">
      {/* Course header with overall progress */}
      <header className="flex flex-wrap items-center gap-4">
        <DigitalBadge track={track} className="w-16" shine={false} />
        <div className="min-w-0 flex-1">
          <Link href={`/join?path=${track.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
            ← {t("course.backToJoin")}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{l(track.name)}</h1>
        </div>
      </header>
      <div>
        <div className="flex justify-between text-xs font-medium text-gray-500">
          <span>{t("course.summary", { modules: track.modules.length, lessons: total })}</span>
          <span>{t("course.progress", { n: progress })}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Outline: modules, their lessons and quiz */}
        <nav aria-label={t("course.outline")} className={`${card} !p-4 lg:sticky lg:top-24 lg:self-start`}>
          <ol className="space-y-4">
            {track.modules.map((m, mi) => (
              <li key={m.id}>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span aria-hidden="true" className="text-lg">{m.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      {t("course.module", { n: mi + 1 })}
                    </span>
                    {l(m.title)}
                  </span>
                  {done.has(m.id) && <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" aria-label="✓" />}
                </p>
                <ol className="mt-2 space-y-1 border-l-2 border-gray-100 pl-3">
                  {m.lessons.map((ls, li) => {
                    const here = !finished && mi === moduleIndex && li === step;
                    return (
                      <li key={li}>
                        <button
                          type="button"
                          onClick={() => goTo(mi, li)}
                          aria-current={here ? "step" : undefined}
                          className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                            here ? "bg-emerald-50 font-semibold text-emerald-800" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span aria-hidden="true">{ls.icon}</span>
                          {l(ls.title)}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button"
                      onClick={() => goTo(mi, m.lessons.length)}
                      aria-current={!finished && mi === moduleIndex && step === m.lessons.length ? "step" : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                        !finished && mi === moduleIndex && step === m.lessons.length
                          ? "bg-emerald-50 font-semibold text-emerald-800"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span aria-hidden="true">🧠</span>
                      {t("course.quiz")}
                    </button>
                  </li>
                </ol>
              </li>
            ))}
          </ol>
        </nav>

        {/* The current lesson, quiz or result */}
        <section className={card} aria-live="polite">
          {finished ? (
            <div className="animate-fade-up py-6 text-center">
              <DigitalBadge track={track} className="mx-auto w-40" />
              <h2 className="mt-5 text-3xl font-bold text-gray-900">🎉 {t("course.complete")}</h2>
              <p className="mx-auto mt-3 max-w-md text-lg text-gray-700">{t("course.completeText")}</p>
              <Link
                href={`/join?path=${track.id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
              >
                {t("course.applyNow")}
                <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-700">
                  {current.icon} {t("course.module", { n: moduleIndex + 1 })} · {l(current.title)}
                </p>
                {lesson && speech.supported && (
                  <button
                    type="button"
                    onClick={listen}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      speech.speaking ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {speech.speaking ? <StopIcon className="h-5 w-5" aria-hidden="true" /> : <SpeakerWaveIcon className="h-5 w-5" aria-hidden="true" />}
                    {speech.speaking ? t("guides.stop") : t("guides.listen")}
                  </button>
                )}
              </div>
              {lesson && (
                <p className="mt-1 text-xs text-gray-500">
                  {t("course.lessonOf", { n: step + 1, total: current.lessons.length })}
                </p>
              )}

              <div className="py-8">
                {lesson ? (
                  <LessonCard key={`${moduleIndex}-${step}`} lesson={lesson} />
                ) : step === quizStep ? (
                  <div className="animate-fade-up">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">🧠 {t("course.quizTitle")}</h2>
                    {/* Re-keyed per module so each quiz starts fresh */}
                    <QuizCard key={current.id} id={`${track.id}-${current.id}`} questions={current.quiz} onPass={passQuiz} />
                  </div>
                ) : (
                  <div className="animate-fade-up py-4 text-center">
                    <span aria-hidden="true" className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-6xl">
                      ✅
                    </span>
                    <h2 className="mt-5 text-3xl font-bold text-gray-900">{t("course.moduleDone")}</h2>
                    <p className="mt-2 text-lg text-gray-700">{l(current.title)}</p>
                  </div>
                )}
              </div>

              {/* Big buttons, easy to hit with a thumb */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => (step > 0 ? goTo(moduleIndex, step - 1) : moduleIndex > 0 && goTo(moduleIndex - 1, 0))}
                  disabled={step === 0 && moduleIndex === 0}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-4 text-base font-semibold text-gray-800 transition hover:bg-gray-200 disabled:opacity-40"
                >
                  <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
                  {t("back")}
                </button>
                {step < quizStep && (
                  <button
                    type="button"
                    onClick={() => goTo(moduleIndex, step + 1)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {step === quizStep - 1 ? t("course.takeQuiz") : t("next")}
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                {step === doneStep && (
                  <button
                    type="button"
                    onClick={nextModule}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {isLastModule && allDone ? t("course.complete") : t("course.nextModule")}
                    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
