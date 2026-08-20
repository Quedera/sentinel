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
                    ? "bg-sentinel text-white"
                    : isComplete
                    ? "bg-sentinel-tint text-sentinel-dark"
                    : "bg-gray-100 text-gray-500"
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
                    ? "text-sentinel-dark"
                    : "text-gray-500"
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
