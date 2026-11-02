type StepIndicatorProps = {
  steps: string[];
  current: number;
  /** "Step 2 of 4", announced to screen readers and shown on small screens */
  label: string;
};

// The current step is always shown (SRS 3.1, 3.14)
export default function StepIndicator({ steps, current, label }: StepIndicatorProps) {
  return (
    <nav aria-label={label}>
      <p className="mb-2 text-sm font-semibold text-green-800">
        {label}: {steps[current]}
      </p>
      <ol className="flex gap-1">
        {steps.map((step, i) => (
          <li
            key={step}
            aria-current={i === current ? "step" : undefined}
            className={`h-2 flex-1 rounded-full ${
              i <= current ? "bg-green-700" : "bg-green-100"
            }`}
            title={step}
          >
            <span className="sr-only">{step}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
