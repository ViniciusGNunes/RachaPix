import React from 'react';

interface SplitMobileStepperProps {
  step: number;
  labels: string[];
}

export function SplitMobileStepper({ step, labels }: SplitMobileStepperProps) {
  return (
    <div className="lg:hidden mb-5 space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {labels.map((_, i) => (
          <div key={i} className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full bg-accent transition-all duration-300 ${
                i <= step ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium">
          Passo {step + 1} de {labels.length}
        </span>
        <span className="text-zinc-200 font-semibold">{labels[step]}</span>
      </div>
    </div>
  );
}
