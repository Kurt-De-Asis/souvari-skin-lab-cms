import { Check } from 'lucide-react';

interface BookingStepsProps {
  currentStep: number;
  steps: string[];
}

export default function BookingSteps({ currentStep, steps }: BookingStepsProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                i < currentStep
                  ? 'bg-neutral-900 text-white'
                  : i === currentStep
                  ? 'bg-neutral-900 text-white ring-4 ring-neutral-100'
                  : 'bg-neutral-100 text-neutral-400'
              }`}
            >
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium hidden sm:block ${
                i <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-3 ${i < currentStep ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
