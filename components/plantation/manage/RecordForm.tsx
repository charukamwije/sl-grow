"use client";

import { FormEvent, useState, useTransition } from "react";
import type { RecordResult } from "@/app/plantation/manage/actions";
import type { PlantationCrop } from "@/lib/data/plantation-records";
import { FIELDS, type Field, type RecordKind, type Worker } from "@/lib/plantation/records";
import Loading from "../../icons/Loading";
import { btnPrimary, btnSecondary, input, label } from "../../ui/styles";

export type FormValues = Record<string, string | boolean>;

type RecordFormProps = {
  kind: RecordKind;
  /** The plantation's crop; a new plantation takes the one being chosen */
  crop: PlantationCrop | null;
  initial?: FormValues;
  workers?: Worker[];
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<RecordResult>;
  onDone: (result: RecordResult) => void;
  onCancel?: () => void;
};

/** Today in the planter's own timezone, as the date input wants it */
export function today(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function defaults(kind: RecordKind, workers: Worker[]): FormValues {
  const values: FormValues = {};
  for (const field of FIELDS[kind]) {
    if (field.type === "checkbox") values[field.name] = field.name === "active";
    else if (field.type === "date" && field.required) values[field.name] = today();
    else values[field.name] = "";
  }
  if (kind === "transaction") values.kind = "expense";
  if (kind === "plantation") values.crop = "tea";
  if (kind === "workday") {
    const worker = workers.find((entry) => entry.active) ?? workers[0];
    if (worker) {
      values.worker_id = worker.id;
      values.wage = String(worker.daily_wage);
    }
  }
  return values;
}

/**
 * Adds or changes one plantation record. The fields come from the same list
 * the server checks against (lib/plantation/records.ts), and the server's
 * messages show under the field they are about.
 */
export default function RecordForm({
  kind,
  crop,
  initial,
  workers = [],
  submitLabel,
  onSubmit,
  onDone,
  onCancel,
}: RecordFormProps) {
  const [values, setValues] = useState<FormValues>(() => ({ ...defaults(kind, workers), ...initial }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fieldCrop: PlantationCrop = crop ?? (values.crop === "cinnamon" ? "cinnamon" : "tea");

  const set = (name: string, value: string | boolean) =>
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // A category belongs to money in or money out, not both
      if (kind === "transaction" && name === "kind") next.category = "";
      // A worker's day starts at their usual wage
      if (kind === "workday" && name === "worker_id") {
        const worker = workers.find((entry) => entry.id === value);
        if (worker) next.wage = String(worker.daily_wage);
      }
      return next;
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.ok) {
        setErrors({});
        onDone(result);
      } else {
        setErrors(result.errors ?? {});
        setError(result.error ?? (result.errors ? "Check the fields marked below." : null));
      }
    });
  };

  const fields = FIELDS[kind].filter((field) => !field.shown || field.shown(fieldCrop, values));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldInput
            key={field.name}
            kind={kind}
            field={field}
            crop={fieldCrop}
            values={values}
            workers={workers}
            error={errors[field.name]}
            onChange={(value) => set(field.name, value)}
            // The crop decides what every record means, so it is set once
            disabled={kind === "plantation" && field.name === "crop" && Boolean(initial)}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending && <Loading size="small" color="white" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function FieldInput({
  kind,
  field,
  crop,
  values,
  workers,
  error,
  onChange,
  disabled,
}: {
  kind: RecordKind;
  field: Field;
  crop: PlantationCrop;
  values: FormValues;
  workers: Worker[];
  error?: string;
  onChange: (value: string | boolean) => void;
  disabled?: boolean;
}) {
  const id = `${kind}-${field.name}`;
  const value = values[field.name];
  const describedBy = [error && `${id}-error`, field.hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  const ring = error ? " ring-red-400" : "";
  const wide = field.type === "textarea" ? "sm:col-span-2" : "";

  if (field.type === "checkbox") {
    return (
      <label htmlFor={id} className="flex items-center gap-3 self-end rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 rounded accent-emerald-600"
        />
        {field.label}
      </label>
    );
  }

  let control;
  if (field.type === "choice" || field.type === "worker") {
    const options =
      field.type === "worker"
        ? workers
            .filter((worker) => worker.active || worker.id === value)
            .map((worker) => ({ value: worker.id, label: worker.name }))
        : field.choices!(crop, values);
    control = (
      <select
        id={id}
        className={input + ring}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        disabled={disabled}
      >
        {!value && <option value="">Choose…</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "textarea") {
    control = (
      <textarea
        id={id}
        rows={2}
        className={input + ring}
        value={String(value ?? "")}
        maxLength={field.maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={describedBy}
      />
    );
  } else {
    control = (
      <input
        id={id}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        inputMode={field.type === "number" ? "decimal" : undefined}
        min={field.min}
        max={field.max}
        step={field.step}
        maxLength={field.maxLength}
        className={input + ring}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={field.required}
      />
    );
  }

  return (
    <div className={wide}>
      <label htmlFor={id} className={label}>
        {field.label}
        {!field.required && <span className="font-normal text-gray-400"> (optional)</span>}
      </label>
      {control}
      {field.hint && !error && (
        <p id={`${id}-hint`} className="mt-1 px-1 text-xs text-gray-500">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 px-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
