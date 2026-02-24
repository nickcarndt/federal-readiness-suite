"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Map,
  RefreshCw,
  AlertTriangle,
  FileText,
  TrendingUp,
  ListChecks,
  ArrowRight,
  CheckCircle2,
  Download,
  RotateCcw,
  Github,
  DollarSign,
  Clock,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAssessment } from "@/context/AssessmentContext";
import type {
  ImplementationRoadmap,
  RoadmapPhase,
  ComplianceStatus,
} from "@/types/assessment";
import { cn } from "@/lib/utils";
import { generateFullReport } from "@/lib/pdf-export";
import { COMPLIANCE_STATUS, COMPLIANCE_REQUIREMENTS } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type StreamState = "idle" | "streaming" | "complete" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_ACCENT_COLORS = [
  {
    bar: "bg-coral",
    badge: "border-coral/30 bg-coral/10 text-coral",
    heading: "text-coral",
  },
  {
    bar: "bg-blue-500",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    heading: "text-blue-400",
  },
  {
    bar: "bg-violet-500",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    heading: "text-violet-400",
  },
  {
    bar: "bg-emerald-500",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    heading: "text-emerald-400",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function AnimatedDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  accentClass,
}: {
  icon: React.ReactNode;
  title: string;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border",
          accentClass
        )}
      >
        {icon}
      </div>
      <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
    </div>
  );
}

// ── Timeline Component ────────────────────────────────────────────────────────

const PhaseCard = memo(function PhaseCard({
  phase,
  index,
  isLast,
}: {
  phase: RoadmapPhase;
  index: number;
  isLast: boolean;
}) {
  const accent = PHASE_ACCENT_COLORS[index % PHASE_ACCENT_COLORS.length];

  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Left column: connector line + duration */}
      <div className="flex flex-col items-center w-28 shrink-0">
        <div
          className={cn(
            "flex items-center justify-center rounded-full border px-2 py-1 text-[10px] font-bold text-center leading-tight",
            accent.badge
          )}
        >
          {phase.duration}
        </div>
        {!isLast && (
          <div className="flex-1 w-0.5 bg-gradient-to-b from-coral/40 to-coral/10 mt-2 min-h-8" />
        )}
      </div>

      {/* Right column: phase card */}
      <div
        className={cn(
          "flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg shadow-black/20",
          isLast ? "mb-0" : "mb-4"
        )}
      >
        {/* Left accent bar */}
        <div className={cn("flex")}>
          <div className={cn("w-1 shrink-0", accent.bar)} />
          <div className="flex-1 p-6">
            {/* Phase header */}
            <div className="flex items-start gap-3 mb-3">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold mt-0.5",
                  accent.badge
                )}
              >
                {index + 1}
              </span>
              <h3 className={cn("text-base font-bold", accent.heading)}>
                {phase.name}
              </h3>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed mb-4">
              {phase.objective}
            </p>

            {/* Deliverables */}
            {phase.deliverables.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Deliverables
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {phase.deliverables.map((d) => (
                    <span
                      key={d}
                      className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stakeholders */}
            {phase.stakeholders.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Stakeholders
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {phase.stakeholders.map((s) => (
                    <span
                      key={s}
                      className="inline-flex rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            {phase.successCriteria.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Success Criteria
                </p>
                <ul className="space-y-1">
                  {phase.successCriteria.map((sc) => (
                    <li key={sc} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-300">{sc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {phase.risks.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Risks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {phase.risks.map((r) => (
                    <span
                      key={r}
                      className="inline-flex rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {phase.dependencies.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                  Dependencies
                </p>
                <ul className="space-y-0.5">
                  {phase.dependencies.map((dep) => (
                    <li
                      key={dep}
                      className="text-xs text-zinc-500 italic pl-2"
                    >
                      ↳ {dep}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const {
    intake,
    results,
    setResults,
    markStepComplete,
    resetAssessment,
    isHydrated,
    demoMode,
  } = useAssessment();

  const [streamedText, setStreamedText] = useState("");
  const [result, setResult] = useState<ImplementationRoadmap | null>(null);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFired = useRef(false);

  const runRoadmap = useCallback(async () => {
    setStreamedText("");
    setResult(null);
    setErrorMessage(null);
    setStreamState("streaming");
    hasFired.current = true;

    if (process.env.NODE_ENV === "development") {
      console.log("[NAV] /roadmap — starting roadmap generation", {
        agency: intake.agencyType,
        hasArchitecture: !!results.architecture,
        hasEvaluation: !!results.evaluation,
      });
    }

    // Build context payload
    const payload = {
      intake: {
        agencyType: intake.agencyType,
        missionDescription: intake.missionDescription,
        painPoints: intake.painPoints,
        dataClassification: intake.dataClassification,
        complianceRequirements: intake.complianceRequirements,
        estimatedVolume: intake.estimatedVolume,
      },
      architecture: results.architecture
        ? {
            recommendedModel: results.architecture.recommendedModel.name,
            deploymentPathway:
              results.architecture.deploymentArchitecture.pathway,
            monthlyCost: results.architecture.costEstimate.monthlyCost,
          }
        : null,
      evaluation: results.evaluation
        ? {
            scenarioTested: results.evaluation.scenarioLabel,
            overallScore: Number(results.evaluation.scores.overallScore),
            modelUsed: results.evaluation.modelUsed,
          }
        : null,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (demoMode) headers["x-demo-mode"] = "true";

      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          response.status === 429
            ? "Rate limit exceeded. Please wait before trying again."
            : (errorData as { error?: string }).error ??
              "Something went wrong. Please try again.";
        setErrorMessage(msg);
        setStreamState("error");
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamedText(fullText);
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[PERF] /roadmap — stream complete", {
          chars: fullText.length,
        });
      }

      // Strip markdown code fences if Claude wrapped the JSON
      const sanitized = fullText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      const parsed: ImplementationRoadmap = JSON.parse(sanitized);
      setResult(parsed);
      setResults({ roadmap: parsed });
      markStepComplete(4);
      setStreamState("complete");

      if (process.env.NODE_ENV === "development") {
        console.log("[NAV] /roadmap — result rendered", {
          phases: parsed.phases.length,
          netSavings: parsed.roiProjection.netAnnualSavings,
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("[CLAUDE] /roadmap — client error", {
        message: error.message,
      });
      setErrorMessage(
        "Failed to parse the roadmap response. Please try again."
      );
      setStreamState("error");
    }
  }, [intake, results, setResults, markStepComplete, demoMode]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!intake.agencyType) {
      router.replace("/");
      return;
    }
    if (!hasFired.current) {
      runRoadmap();
    }
  }, [intake.agencyType, isHydrated, router, runRoadmap]);

  function handleStartOver() {
    resetAssessment();
    router.push("/");
  }

  // ── Hydration loading state ───────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading assessment...</div>
      </div>
    );
  }

  // ── Loading / streaming state ─────────────────────────────────────────────
  if (streamState === "streaming" || streamState === "idle") {
    const lines = streamedText.split("\n");
    const displayLines = lines.slice(-60).join("\n");

    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-10 text-center shadow-2xl shadow-black/40">
            <div className="mb-6 flex justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-coral/20 bg-coral/5">
                <Map className="h-8 w-8 text-coral" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-40" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                </span>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100">
              Generating your implementation roadmap
              <AnimatedDots />
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Claude is building a phased deployment plan tailored to your
              agency
            </p>

            {streamedText && (
              <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-left">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                  Live response stream
                </p>
                <pre className="max-h-48 overflow-hidden font-mono text-[11px] leading-relaxed text-zinc-600 whitespace-pre-wrap">
                  {displayLines}
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-zinc-500 ml-0.5 align-middle" />
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (streamState === "error") {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-xl border border-red-500/20 bg-zinc-900/60 p-10 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
            </div>
            <h1 className="text-lg font-semibold text-zinc-100">
              Roadmap generation failed
            </h1>
            <p className="mt-2 text-sm text-zinc-500">{errorMessage}</p>
            <Button
              onClick={runRoadmap}
              className="mt-6 bg-coral hover:bg-coral-hover text-white gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result state ───────────────────────────────────────────────────────────
  if (!result) return null;

  const { roiProjection } = result;

  // Parse cost numbers for proportional bar (strip $ and commas)
  function parseCost(str: string): number {
    return parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
  }
  const currentCostNum = parseCost(roiProjection.currentAnnualCost);
  const claudeCostNum = parseCost(roiProjection.claudeAnnualCost);
  const claudeBarPct =
    currentCostNum > 0
      ? Math.max(5, Math.round((claudeCostNum / currentCostNum) * 100))
      : 50;

  return (
    <div className="min-h-screen bg-zinc-950">
      {demoMode && (
        <div className="bg-[#E07A5F]/10 border-b border-[#E07A5F]/20 px-4 py-2 text-center">
          <span className="text-[#E07A5F] text-xs font-medium">
            Demo Mode — HHS Medicare Eligibility Scenario
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-6 py-16 space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="text-xs font-medium text-coral tracking-wide">
              Implementation Roadmap
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Your Claude Deployment Roadmap
          </h1>
          <p className="mt-2 text-zinc-400">
            Phased plan for{" "}
            <span className="text-zinc-200 font-medium">
              {intake.agencyType.toUpperCase()}
            </span>{" "}
            · {result.phases.length} phases ·{" "}
            <span className="text-emerald-400 font-medium">
              {roiProjection.netAnnualSavings}
            </span>{" "}
            projected annual savings
          </p>
        </div>

        {/* 1. Executive Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-1 w-full bg-gradient-to-r from-coral to-coral/30" />
          <div className="p-8">
            <SectionHeader
              icon={<FileText className="h-4 w-4 text-coral" />}
              title="Executive Summary"
              accentClass="bg-coral/10 border-coral/20"
            />
            <p className="text-lg text-zinc-200 leading-relaxed">
              {result.executiveSummary}
            </p>
          </div>
        </div>

        {/* 2. Timeline Visualization */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<ListChecks className="h-4 w-4 text-blue-400" />}
              title="Phased Implementation Timeline"
              accentClass="bg-blue-500/10 border-blue-500/20"
            />

            <div className="space-y-0">
              {result.phases.map((phase, i) => (
                <PhaseCard
                  key={phase.name}
                  phase={phase}
                  index={i}
                  isLast={i === result.phases.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. ROI Projection */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              title="ROI Projection"
              accentClass="bg-emerald-500/10 border-emerald-500/20"
            />

            {/* Side-by-side cost comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Current state */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Current State
                </p>
                <p className="text-2xl font-bold text-zinc-100 mb-1">
                  {roiProjection.currentAnnualCost}
                </p>
                <p className="text-xs text-zinc-500">
                  {roiProjection.currentCostBreakdown}
                </p>
                {/* Bar — always full width reference */}
                <div className="mt-4 h-2 w-full rounded-full bg-zinc-700" />
              </div>

              {/* With Claude */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 mb-3">
                  With Claude
                </p>
                <p className="text-2xl font-bold text-emerald-400 mb-1">
                  {roiProjection.claudeAnnualCost}
                </p>
                <p className="text-xs text-zinc-500">
                  {roiProjection.claudeCostBreakdown}
                </p>
                {/* Proportional bar */}
                <div className="mt-4 h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${claudeBarPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Savings badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wide font-semibold">
                    Net Annual Savings
                  </p>
                  <p className="text-lg font-bold text-emerald-300">
                    {roiProjection.netAnnualSavings}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <Zap className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">
                    Efficiency Gain
                  </p>
                  <p className="text-sm font-bold text-zinc-200">
                    {roiProjection.efficiencyGain}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">
                    Payback Period
                  </p>
                  <p className="text-sm font-bold text-zinc-200">
                    {roiProjection.paybackPeriod}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Recommended Next Steps */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<ChevronRight className="h-4 w-4 text-violet-400" />}
              title="Recommended Next Steps"
              accentClass="bg-violet-500/10 border-violet-500/20"
            />

            <ol className="space-y-3">
              {result.nextSteps.map((step, i) => (
                <li
                  key={step.action}
                  className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
                >
                  {/* Number circle */}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-coral/30 bg-coral/10 text-xs font-bold text-coral mt-0.5">
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {step.action}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Owner badge */}
                      {step.owner.toLowerCase().includes("anthropic") ? (
                        <span className="inline-flex items-center rounded-full border border-coral/30 bg-coral/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral">
                          Anthropic
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400">
                          {step.owner}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">
                        {step.timeline}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8">
          <div className="mb-4">
            <p className="text-sm font-medium text-zinc-200">
              Assessment complete. Ready to move forward?
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Share this roadmap with your leadership team or start a new
              assessment for a different use case.
            </p>
          </div>

          <Separator className="mb-6 bg-zinc-800" />

          <div className="flex flex-wrap items-center gap-3">
            {/* Download Full Report */}
            <Button
              onClick={() => {
                const complianceArray: ComplianceStatus[] =
                  intake.complianceRequirements.map((id) => {
                    const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === id);
                    const entry =
                      COMPLIANCE_STATUS[id as keyof typeof COMPLIANCE_STATUS];
                    return {
                      framework: req?.label ?? id,
                      status: (entry?.status ??
                        "conditional") as ComplianceStatus["status"],
                      detail: entry?.detail ?? "",
                    };
                  });
                generateFullReport(
                  intake,
                  results.architecture ?? null,
                  results.evaluation ?? null,
                  complianceArray,
                  result
                );
              }}
              variant="outline"
              className="border-coral/30 text-coral hover:bg-coral/10 hover:border-coral/50 gap-2"
            >
              <Download className="h-4 w-4" />
              Download Full Report
            </Button>

            {/* Start Over */}
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Start Over
            </Button>

            {/* View on GitHub */}
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 gap-2"
            >
              <a
                href="https://github.com/nickcarndt/federal-readiness-suite"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Re-run roadmap */}
            <Button
              onClick={runRoadmap}
              variant="ghost"
              className="text-zinc-500 hover:text-zinc-300 gap-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>

          {/* Capstone message */}
          <div className="mt-6 rounded-lg border border-coral/10 bg-coral/5 p-4 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-coral shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              This assessment was generated by{" "}
              <span className="text-zinc-200 font-medium">Claude Sonnet</span>{" "}
              and reflects Anthropic&apos;s current federal deployment
              capabilities as of 2025. For a production engagement, an
              Anthropic Solutions Architect would validate and refine this
              roadmap with your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
