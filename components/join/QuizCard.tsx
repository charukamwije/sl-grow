"use client";

import { useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { useLanguage } from "@/contexts/language-context";
import { useNotification } from "@/contexts/notification-context";
import type { Question } from "@/lib/data/certifications";
import { btnPrimary } from "../ui/styles";

type QuizCardProps = {
  /** Unique per quiz, so radio groups on one page never clash */
  id: string;
  questions: Question[];
  /** Called once every answer is right */
  onPass: () => void;
};

/**
 * A short quiz with big tap targets. Wrong picks are marked after checking
 * and the score is shown, so the learner can read again and retry.
 */
export default function QuizCard({ id, questions, onPass }: QuizCardProps) {
  const { t, l } = useLanguage();
  const { addErrorNotification } = useNotification();
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  const check = () => {
    if (answers.some((answer) => answer === null)) {
      addErrorNotification(t("join.quizIncomplete"));
      return;
    }
    setChecked(true);
    if (score === questions.length) onPass();
  };

  return (
    <div className="space-y-5">
      {questions.map((q, qi) => (
        <fieldset key={qi}>
          <legend className="mb-3 text-lg font-semibold text-gray-900">
            {qi + 1}. {l(q.question)}
          </legend>
          <div className="grid gap-2">
            {q.options.map((option, oi) => {
              const chosen = answers[qi] === oi;
              const wrong = checked && chosen && oi !== q.answer;
              return (
                <label
                  key={oi}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-base transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                    wrong
                      ? "bg-red-50 text-red-900 ring-1 ring-red-200"
                      : chosen
                        ? "bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500"
                        : "bg-gray-50 text-gray-800 ring-1 ring-transparent hover:ring-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-q${qi}`}
                    checked={chosen}
                    onChange={() => {
                      setChecked(false);
                      setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
                    }}
                    className="sr-only"
                  />
                  {wrong ? (
                    <XCircleIcon className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`h-5 w-5 shrink-0 rounded-full border-2 ${
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

      {checked && score < questions.length && (
        <p role="alert" className="rounded-2xl bg-amber-50 p-4 text-base text-amber-900">
          {t("join.quizRetry", { n: score, total: questions.length })}
        </p>
      )}

      <button type="button" onClick={check} className={`${btnPrimary} w-full !py-4 text-base sm:w-auto`}>
        {t("join.check")}
      </button>
    </div>
  );
}
