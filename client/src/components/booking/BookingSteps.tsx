import { Check } from 'lucide-react';

interface BookingStepsProps {
  currentStep: number;
  steps: string[];
}

export default function BookingSteps({ currentStep, steps }: BookingStepsProps) {
  return (
    <div className="flex items-center justify-between mb-10 overflow-x-auto scrollbar-hide">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-initial min-w-fit">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center text-xs font-semibold transition ${
                i < currentStep
                  ? 'bg-neutral-900 text-white'
                  : i === currentStep
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 text-neutral-400'
              }`}
            >
              {i < currentStep ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`text-[10px] sm:text-xs mt-2 font-medium uppercase tracking-[0.15em] text-center whitespace-nowrap px-1 ${
                i <= currentStep ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 sm:mx-3 ${i < currentStep ? 'bg-primary-600' : 'bg-neutral-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}