"use client";

type SegmentedProps<T extends string> = {
  name: string;
  /** Accessible name of the whole group */
  legend: string;
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (value: T) => void;
  showLegend?: boolean;
};

/**
 * A pill-shaped toggle between a few options. Built on real radio buttons,
 * so keyboards, screen readers and labels work as they would on a form.
 */
export default function Segmented<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  showLegend = false,
}: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className={showLegend ? "mb-1.5 text-sm font-medium text-gray-700" : "sr-only"}>
        {legend}
      </legend>
      <div className="inline-flex w-full rounded-full bg-gray-100 p-1">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-500 ${
                checked
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.icon && <span aria-hidden="true">{option.icon}</span>}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
