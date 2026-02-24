"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/constants";
import { useAssessment } from "@/context/AssessmentContext";

export function StepIndicator() {
  const pathname = usePathname();
  const { isStepCompleted } = useAssessment();

  return (
    <nav aria-label="Assessment progress" className="hidden md:flex items-center gap-1">
      {STEPS.map((step, index) => {
        const isActive = pathname === step.route;
        const isCompleted = isStepCompleted(index);

        const label = (
          <span className="flex items-center gap-1.5">
            {isCompleted && !isActive ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border",
                  isActive
                    ? "border-coral bg-coral text-white"
                    : isCompleted
                    ? "border-zinc-500 bg-zinc-700 text-zinc-300"
                    : "border-zinc-700 bg-transparent text-zinc-600"
                )}
              >
                {index + 1}
              </span>
            )}
            <span className="text-xs font-medium">{step.label}</span>
          </span>
        );

        return (
          <div key={step.route} className="flex items-center">
            {isCompleted && !isActive ? (
              <Link
                href={step.route}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors",
                  "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                {label}
              </Link>
            ) : (
              <span
                className={cn(
                  "px-2 py-1 rounded-md",
                  isActive
                    ? "text-coral"
                    : "text-zinc-600 cursor-not-allowed"
                )}
              >
                {label}
              </span>
            )}

            {index < STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-0.5 text-xs select-none",
                  isCompleted ? "text-zinc-500" : "text-zinc-700"
                )}
              >
                →
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
