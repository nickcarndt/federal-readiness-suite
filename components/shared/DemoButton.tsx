"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Sparkles, X } from "lucide-react";
import { useAssessment } from "@/context/AssessmentContext";
import { DEMO_INTAKE } from "@/lib/demo-data";

export function DemoButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { setIntake, setDemoMode, resetAssessment } = useAssessment();

  function handleGuidedDemo() {
    setDemoMode(true);
    setIntake(DEMO_INTAKE);
    router.push("/");
    setIsOpen(false);
  }

  function handleReset() {
    resetAssessment();
    router.push("/");
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3
                   bg-gradient-to-r from-[#E07A5F] to-[#C4623F] text-white
                   rounded-full shadow-lg shadow-[#E07A5F]/20
                   hover:shadow-xl hover:shadow-[#E07A5F]/30
                   hover:scale-105 transition-all duration-200"
        aria-label="Launch demo"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Live Demo</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="fixed bottom-20 right-6 z-50 w-80 bg-zinc-900 border border-zinc-700
                       rounded-xl shadow-2xl p-5 animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Federal Readiness Demo
                </h3>
                <p className="text-zinc-400 text-xs mt-1">
                  HHS Medicare Eligibility — pre-configured scenario
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Close demo menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={handleGuidedDemo}
                className="w-full flex items-center gap-3 p-3 rounded-lg
                           bg-zinc-800 border border-zinc-700
                           hover:border-[#E07A5F]/50
                           transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#E07A5F]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#E07A5F]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    Guided Walkthrough
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Pre-fills form — then live Claude API calls on each step
                  </p>
                </div>
              </button>
            </div>

            <div className="border-t border-zinc-800 mt-3 pt-3">
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg
                           text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60
                           transition-all text-left"
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">Reset &amp; Start Fresh</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
