interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Onboarding progress">
      <ol className="space-y-3 mb-8">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isComplete = idx < currentStep;
          return (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-quedera-emerald text-quedera-surface"
                    : isComplete
                    ? "bg-quedera-emerald/10 text-quedera-emerald"
                    : "bg-quedera-surface text-quedera-navy/50"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : idx + 1}
              </span>
              <span
                className={
                  isActive
                    ? "font-semibold text-quedera-navy"
                    : isComplete
                    ? "text-quedera-emerald"
                    : "text-quedera-navy/50"
                }
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
