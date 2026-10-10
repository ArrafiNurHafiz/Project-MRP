'use client';

import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface LifecycleStepperProps {
  steps: StepItem[];
  currentStepId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LifecycleStepper({
  steps,
  currentStepId,
  className = '',
  size = 'md',
}: LifecycleStepperProps) {
  const currentIndex = steps.findIndex(
    (s) => s.id.toLowerCase() === currentStepId.toLowerCase()
  );

  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center min-w-max space-x-1 sm:space-x-2">
        {steps.map((step, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isPending = currentIndex < idx;

          return (
            <React.Fragment key={step.id}>
              {/* Step Pill / Node */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold'
                    : 'bg-slate-100/80 text-slate-400 border border-slate-200/60 font-medium'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    isCurrent
                      ? 'bg-white text-blue-600 font-extrabold'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : isCurrent ? (
                    <Clock className="w-3 h-3 stroke-[2.5] animate-pulse" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="leading-tight">{step.label}</span>
                  {step.sublabel && (
                    <span
                      className={`text-[9px] ${
                        isCurrent
                          ? 'text-blue-100'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.sublabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-6 rounded-full transition-colors ${
                    isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
