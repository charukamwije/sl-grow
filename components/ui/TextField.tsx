"use client";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "tel";
  multiline?: boolean;
  rows?: number;
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
};

/**
 * A text field whose label sits inside the box and floats up once the box
 * is focused or filled, so a form reads as a few tidy boxes rather than a
 * column of labels.
 */
export default function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  multiline,
  rows = 3,
  autoComplete,
  maxLength,
  required,
  hint,
}: TextFieldProps) {
  const shared = {
    id,
    value,
    // A blank placeholder lets the label tell empty from filled with CSS
    placeholder: " ",
    autoComplete,
    maxLength,
    required,
    "aria-describedby": hint ? `${id}-hint` : undefined,
    className:
      "peer block w-full rounded-2xl border-0 bg-gray-50 px-4 pb-2.5 pt-6 text-base text-gray-900 sm:text-sm ring-1 ring-inset ring-gray-200 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500",
  };

  return (
    <div>
      <div className="relative">
        {multiline ? (
          <textarea
            {...shared}
            rows={rows}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <input
            {...shared}
            type={type}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-1.5 text-xs font-medium text-gray-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-emerald-700"
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 px-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
    </div>
  );
}
