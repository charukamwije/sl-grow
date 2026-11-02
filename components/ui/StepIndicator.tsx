import { CheckIcon } from "@heroicons/react/20/solid";

type StepIndicatorProps = {
  steps: string[];
  current: number;
  /** "Step 2 of 4", announced to screen readers and shown on small screens */
  label: string;
  /** Lets the user jump back to a step already done */
  onSelect?: (index: number) => void;
};

// The current step is always shown (SRS 3.1, 3.14)
export default function StepIndicator({
  steps,
  current,
  label,
  onSelect,
}: StepIndicatorProps) {
  return (
    <nav aria-label={label}>
      <p className="mb-3 text-sm font-medium text-gray-500 sm:hidden">
        {label}: <span className="text-gray-900">{steps[current]}</span>
      </p>
      <ol className="flex items-center gap-2">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = done && onSelect;
          const dot = (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                active
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                  : done
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
          );

          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="flex flex-1 items-center gap-2 last:flex-none"
            >
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {dot}
                  <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                    {step}
                  </span>
                </button>
              ) : (
                <span className="flex items-center gap-2">
                  {dot}
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      active ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${done ? "bg-emerald-600" : "bg-gray-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
