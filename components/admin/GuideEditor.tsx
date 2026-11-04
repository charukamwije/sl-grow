"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { removeGuide, saveGuide } from "@/app/admin/guides/actions";
import GuideView from "@/components/guides/GuideView";
import Loading from "@/components/icons/Loading";
import Segmented from "@/components/ui/Segmented";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  card,
  input,
  label,
  muted,
  subheading,
} from "@/components/ui/styles";
import { useCatalog } from "@/contexts/catalog-context";
import { CATEGORIES, type Category } from "@/lib/data/products";
import type { Guide, GuideKind, GuideStep } from "@/lib/data/guides";
import { MAX_STEPS, type GuideFormErrors, type GuideInput } from "@/lib/guide-form";
import { isBuiltInGuide } from "@/lib/guides";
import type { Lang, Localized } from "@/lib/i18n/types";
import { productCode } from "@/lib/products";

type GuideEditorProps = {
  /** Absent when creating a general guide */
  guide?: Guide & { active: boolean };
};

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" },
];

const EMPTY: Localized = { en: "", si: "", ta: "" };

const emptyStep = (): GuideStep => ({ icon: "🌱", title: { ...EMPTY }, text: { ...EMPTY } });

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-1 text-xs text-red-700">
      {message}
    </p>
  ) : null;
}

export default function GuideEditor({ guide }: GuideEditorProps) {
  const router = useRouter();
  const { products: catalogProducts, getProduct } = useCatalog();
  const kind: GuideKind = guide?.kind ?? "general";
  const builtIn = isBuiltInGuide(kind);
  const hasTime = kind === "package" || kind === "soil";

  const [id, setId] = useState(guide?.id ?? "");
  const [draft, setDraft] = useState<GuideInput>({
    name: guide?.name ?? { ...EMPTY },
    icon: guide?.icon ?? "📘",
    time: guide?.time ?? (hasTime ? { ...EMPTY } : null),
    steps: guide?.steps.length ? guide.steps : [emptyStep()],
    products: guide?.products ?? [],
    active: guide?.active ?? true,
  });
  const [lang, setLang] = useState<Lang>("en");
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<GuideFormErrors>({});
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const update = (patch: Partial<GuideInput>) => {
    setSaved(false);
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateStep = (index: number, patch: Partial<GuideStep>) =>
    update({
      steps: draft.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    });

  const moveStep = (index: number, by: -1 | 1) => {
    const steps = [...draft.steps];
    const [step] = steps.splice(index, 1);
    steps.splice(index + by, 0, step);
    update({ steps });
  };

  const toggleProduct = (productId: string) =>
    update({
      products: draft.products.includes(productId)
        ? draft.products.filter((p) => p !== productId)
        : [...draft.products, productId],
    });

  // Recommended products that are hidden or deleted, so not in the catalogue
  const missingProducts = draft.products.filter((productId) => !getProduct(productId));

  const byCategory = useMemo(() => {
    const groups = new Map<Category, typeof catalogProducts>();
    for (const category of CATEGORIES) groups.set(category, []);
    for (const product of catalogProducts) groups.get(product.category)!.push(product);
    return groups;
  }, [catalogProducts]);

  const save = () => {
    setErrors({});
    setSaved(false);
    startSaving(async () => {
      const result = await saveGuide(guide ? "update" : "create", id.trim(), JSON.stringify(draft));
      if (result.errors) setErrors(result.errors);
      else setSaved(true);
    });
  };

  const remove = () => {
    if (!guide || !window.confirm(`Delete the guide "${guide.name.en}" for good?`)) return;
    startDeleting(async () => {
      const result = await removeGuide(guide.id);
      if (result.ok) router.push("/admin/guides");
      else setErrors({ form: result.error });
    });
  };

  if (preview) {
    const previewGuide: Guide = {
      id: id || "preview",
      kind,
      icon: draft.icon,
      name: draft.name,
      ...(draft.time?.en ? { time: draft.time } : {}),
      ...(guide?.vegId ? { vegId: guide.vegId } : {}),
      steps: draft.steps,
      products: draft.products.filter((productId) => getProduct(productId)),
    };

    return (
      <div className="space-y-4">
        <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <p className={muted}>
            Preview of your unsaved changes, as readers will see them. Use the language buttons
            in the header to check Sinhala and Tamil.
          </p>
          <button type="button" className={btnSecondary} onClick={() => setPreview(false)}>
            Back to editing
          </button>
        </div>
        <GuideView guide={previewGuide} guides={[]} />
      </div>
    );
  }

  const stepErrors = errors.steps ?? {};

  return (
    <div className="space-y-4">
      {errors.form && (
        <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">
          {errors.form}
        </p>
      )}

      <section className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={subheading}>Details</h2>
          <div className="w-full sm:w-80">
            <Segmented
              name="edit-lang"
              legend="Language you are editing"
              showLegend
              value={lang}
              options={LANG_OPTIONS}
              onChange={setLang}
            />
          </div>
        </div>
        <p className={muted}>
          Every field below is shown in the language chosen here. English is required; readers
          who chose Sinhala or Tamil see English wherever that language is left empty.
        </p>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label htmlFor="guide-name" className={label}>
              Name ({LANG_OPTIONS.find((option) => option.value === lang)!.label})
            </label>
            <input
              id="guide-name"
              className={input}
              value={draft.name[lang]}
              onChange={(event) => update({ name: { ...draft.name, [lang]: event.target.value } })}
            />
            <FieldError message={errors.name} />
          </div>
          <div>
            <label htmlFor="guide-icon" className={label}>
              Emoji
            </label>
            <input
              id="guide-icon"
              className={input}
              value={draft.icon}
              maxLength={16}
              onChange={(event) => update({ icon: event.target.value })}
            />
            <FieldError message={errors.icon} />
          </div>
        </div>

        {!guide && (
          <div>
            <label htmlFor="guide-id" className={label}>
              Address
            </label>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>/guides/</span>
              <input
                id="guide-id"
                className={input}
                value={id}
                placeholder="balcony-herbs"
                onChange={(event) => setId(event.target.value.toLowerCase())}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Lower-case letters, digits and hyphens. It cannot be changed later.
            </p>
            <FieldError message={errors.id} />
          </div>
        )}

        {hasTime && draft.time && (
          <div>
            <label htmlFor="guide-time" className={label}>
              Ready in
            </label>
            <input
              id="guide-time"
              className={input}
              value={draft.time[lang]}
              placeholder="e.g. 1 day"
              onChange={(event) => update({ time: { ...draft.time!, [lang]: event.target.value } })}
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={draft.active}
              disabled={builtIn}
              onChange={(event) => update({ active: event.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Show on the Grow guides page
          </label>
          {builtIn && (
            <p className="mt-1 text-xs text-gray-500">
              The shop, planner and courses link to this guide, so it is always shown.
            </p>
          )}
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={subheading}>Steps</h2>
        <p className={muted}>
          Write <code className="rounded bg-emerald-50 px-1 text-emerald-700">[[f_compost]]</code> in
          a step to show that product with its name and code. One sentence per idea reads best on a
          phone.
        </p>
        <FieldError message={errors.stepsList} />

        <ol className="space-y-4">
          {draft.steps.map((step, index) => (
            <li key={index} className="space-y-3 rounded-2xl p-4 ring-1 ring-black/10">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">Step {index + 1}</p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={btnSecondary + " px-2.5 py-1.5"}
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move step ${index + 1} up`}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={btnSecondary + " px-2.5 py-1.5"}
                    onClick={() => moveStep(index, 1)}
                    disabled={index === draft.steps.length - 1}
                    aria-label={`Move step ${index + 1} down`}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={btnDanger + " px-2.5 py-1.5"}
                    onClick={() => update({ steps: draft.steps.filter((_, i) => i !== index) })}
                    disabled={draft.steps.length === 1}
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
                <div>
                  <label htmlFor={`step-${index}-icon`} className="mb-1 block text-xs text-gray-600">
                    Emoji
                  </label>
                  <input
                    id={`step-${index}-icon`}
                    className={input}
                    value={step.icon}
                    maxLength={16}
                    onChange={(event) => updateStep(index, { icon: event.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor={`step-${index}-title`} className="mb-1 block text-xs text-gray-600">
                    Title
                  </label>
                  <input
                    id={`step-${index}-title`}
                    className={input}
                    value={step.title[lang]}
                    onChange={(event) =>
                      updateStep(index, { title: { ...step.title, [lang]: event.target.value } })
                    }
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`step-${index}-text`} className="mb-1 block text-xs text-gray-600">
                  Text
                </label>
                <textarea
                  id={`step-${index}-text`}
                  className={`${input} min-h-28`}
                  value={step.text[lang]}
                  onChange={(event) =>
                    updateStep(index, { text: { ...step.text, [lang]: event.target.value } })
                  }
                />
              </div>
              <FieldError message={stepErrors[index]} />
            </li>
          ))}
        </ol>

        <button
          type="button"
          className={btnSecondary}
          onClick={() => update({ steps: [...draft.steps, emptyStep()] })}
          disabled={draft.steps.length >= MAX_STEPS}
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          Add step
        </button>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={subheading}>Recommended products</h2>
        <p className={muted}>
          Shown at the end of the guide, each with an Add button.
        </p>
        {missingProducts.length > 0 && (
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            Hidden or deleted, so not shown to readers:{" "}
            {missingProducts.map((productId) => (
              <button
                key={productId}
                type="button"
                onClick={() => toggleProduct(productId)}
                className="mr-1 rounded-full bg-white px-2 py-0.5 font-mono text-xs ring-1 ring-amber-300"
              >
                {productCode(productId)} ✕
              </button>
            ))}
          </p>
        )}
        <FieldError message={errors.products} />

        <div className="space-y-4">
          {[...byCategory].map(([category, products]) =>
            products.length === 0 ? null : (
              <fieldset key={category}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {category}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-black/5 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={draft.products.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span aria-hidden="true">{product.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{product.name.en}</span>
                      <code className="text-xs text-gray-500">{productCode(product.id)}</code>
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          )}
        </div>
      </section>

      <div className={`${card} flex flex-wrap items-center gap-3`}>
        <button type="button" className={btnPrimary} onClick={save} disabled={saving}>
          {saving && <Loading size="small" color="white" />}
          {guide ? "Save changes" : "Create guide"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => setPreview(true)}>
          Preview
        </button>
        {saved && (
          <p role="status" className="text-sm text-emerald-700">
            Saved. Readers see the change now.
          </p>
        )}
        {Object.keys(errors).length > 0 && !errors.form && (
          <p role="alert" className="text-sm text-red-700">
            Some fields need attention.
          </p>
        )}
        {guide && !builtIn && (
          <button type="button" className={`${btnDanger} ml-auto`} onClick={remove} disabled={deleting}>
            {deleting && <Loading size="small" color="red" />}
            Delete guide
          </button>
        )}
      </div>
    </div>
  );
}
