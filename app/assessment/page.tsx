"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Server,
  DollarSign,
  Cpu,
  Network,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAssessment } from "@/context/AssessmentContext";
import { ArchitectureDiagram } from "@/components/screens/ArchitectureDiagram";
import type { ArchitectureRecommendation, KeyConsideration } from "@/types/assessment";
import { cn } from "@/lib/utils";
import { AGENCY_TYPES } from "@/lib/constants";

type StreamState = "idle" | "streaming" | "complete" | "error";

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

function ConsiderationBadge({ type }: { type: KeyConsideration["type"] }) {
  if (type === "risk") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
        <AlertTriangle className="h-2.5 w-2.5" />
        Risk
      </span>
    );
  }
  if (type === "prerequisite") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
        <CheckCircle className="h-2.5 w-2.5" />
        Prerequisite
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
      <Lightbulb className="h-2.5 w-2.5" />
      Opportunity
    </span>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        highlight
          ? "border-coral/30 bg-coral/5"
          : "border-zinc-800 bg-zinc-900/50"
      )}
    >
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p
        className={cn(
          "text-sm font-bold",
          highlight ? "text-coral" : "text-zinc-100"
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function AssessmentPage() {
  const router = useRouter();
  const { intake, setResults, markStepComplete, isHydrated, demoMode } =
    useAssessment();

  const [streamedText, setStreamedText] = useState("");
  const [result, setResult] = useState<ArchitectureRecommendation | null>(null);
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFired = useRef(false);

  const runAssessment = useCallback(async () => {
    setStreamedText("");
    setResult(null);
    setErrorMessage(null);
    setStreamState("streaming");
    hasFired.current = true;

    if (process.env.NODE_ENV === "development") {
      console.log("[NAV] /assessment — starting assessment", {
        agency: intake.agencyType,
      });
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (demoMode) headers["x-demo-mode"] = "true";

      const response = await fetch("/api/assess", {
        method: "POST",
        headers,
        body: JSON.stringify(intake),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg =
          response.status === 429
            ? "Rate limit exceeded. Please wait before trying again."
            : errorData.error ?? "Something went wrong. Please try again.";
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
        console.log("[PERF] /assessment — stream complete", {
          chars: fullText.length,
        });
      }

      // Strip markdown code fences if Claude wrapped the JSON (e.g. ```json ... ```)
      const sanitized = fullText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      // Parse complete JSON
      const parsed: ArchitectureRecommendation = JSON.parse(sanitized);
      setResult(parsed);
      setResults({ architecture: parsed });
      setStreamState("complete");

      if (process.env.NODE_ENV === "development") {
        console.log("[NAV] /assessment — result rendered", {
          model: parsed.recommendedModel.modelId,
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("[CLAUDE] /assessment — client error", {
        message: error.message,
      });
      setErrorMessage(
        "Failed to parse the assessment response. Please try again."
      );
      setStreamState("error");
    }
  }, [intake, setResults, demoMode]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!intake.agencyType) {
      router.replace("/");
      return;
    }
    if (!hasFired.current) {
      runAssessment();
    }
  }, [intake.agencyType, isHydrated, router, runAssessment]);

  function handleContinue() {
    markStepComplete(1);
    router.push("/evaluate");
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
                <Cpu className="h-8 w-8 text-coral" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-40" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                </span>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-zinc-100">
              Analyzing your mission requirements
              <AnimatedDots />
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Claude is generating a tailored architecture recommendation for
              your agency
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
              Assessment failed
            </h1>
            <p className="mt-2 text-sm text-zinc-500">{errorMessage}</p>
            <Button
              onClick={runAssessment}
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
              Architecture Recommendation
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
            Your Claude Deployment Plan
          </h1>
          <p className="mt-2 text-zinc-400">
            Tailored for{" "}
            <span className="text-zinc-200 font-medium">
              {AGENCY_TYPES.find((a) => a.value === intake.agencyType)?.label ?? intake.agencyType}
            </span>{" "}
            · {intake.dataClassification} classification
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

        {/* 2. Recommended Model */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<Cpu className="h-4 w-4 text-coral" />}
              title="Recommended Model"
              accentClass="bg-coral/10 border-coral/20"
            />

            <div className="flex flex-wrap items-start gap-3 mb-4">
              <span className="inline-flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-sm font-bold text-coral">
                {result.recommendedModel.name}
              </span>
              <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                {result.recommendedModel.contextWindow} context
              </span>
              <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                {result.recommendedModel.name}
              </span>
            </div>

            <p className="text-zinc-300 leading-relaxed text-sm">
              {result.recommendedModel.reasoning}
            </p>

            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                Key strength for your use case
              </p>
              <p className="text-sm text-zinc-200">
                {result.recommendedModel.strengthForUseCase}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Deployment Architecture */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<Network className="h-4 w-4 text-blue-400" />}
              title="Deployment Architecture"
              accentClass="bg-blue-500/10 border-blue-500/20"
            />

            <p className="text-sm text-zinc-400 mb-6">
              {result.deploymentArchitecture.pathwayReasoning}
            </p>

            <ArchitectureDiagram
              layers={result.deploymentArchitecture.layers}
              securityBoundary={result.deploymentArchitecture.securityBoundary}
              pathway={result.deploymentArchitecture.pathway}
            />
          </div>
        </div>

        {/* 4. MCP Integrations */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<Server className="h-4 w-4 text-violet-400" />}
              title="MCP Integrations"
              accentClass="bg-violet-500/10 border-violet-500/20"
            />

            <div className="space-y-3">
              {result.mcpIntegrations.map((mcp) => (
                <div
                  key={mcp.name}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {mcp.name}
                    </h3>
                    <span className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                      MCP Server
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mb-2">{mcp.purpose}</p>
                  <p className="text-xs text-zinc-500 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">↳</span>
                    {mcp.dataFlow}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Cost Estimate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
              title="Cost Estimate"
              accentClass="bg-emerald-500/10 border-emerald-500/20"
            />

            {/* Per-query breakdown */}
            <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                Per query breakdown
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-zinc-600">Input tokens</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                    {result.costEstimate.modelCostPerQuery.inputTokens}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-600">Output tokens</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-0.5">
                    {result.costEstimate.modelCostPerQuery.outputTokens}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-600">Cost / query</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">
                    {result.costEstimate.modelCostPerQuery.costPerQuery}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial comparison grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Monthly Claude cost"
                value={result.costEstimate.monthlyCost}
              />
              <StatCard
                label="Current state cost"
                value={result.costEstimate.currentStateCost}
              />
              <StatCard
                label="Annual savings"
                value={result.costEstimate.annualSavings}
                highlight
              />
              <StatCard
                label="ROI multiple"
                value={result.costEstimate.roiMultiple}
                highlight
              />
            </div>
          </div>
        </div>

        {/* 6. Key Considerations */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
          <div className="h-px w-full bg-zinc-800" />
          <div className="p-8">
            <SectionHeader
              icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              title="Key Considerations"
              accentClass="bg-amber-500/10 border-amber-500/20"
            />

            <div className="space-y-3">
              {result.keyConsiderations.map((consideration) => (
                <div
                  key={consideration.title}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <ConsiderationBadge type={consideration.type} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {consideration.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                        {consideration.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-8">
          <Separator className="mb-6 bg-zinc-800" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Ready to validate this recommendation?
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Test Claude against a real scenario from your domain
              </p>
            </div>
            <Button
              onClick={handleContinue}
              className={cn(
                "group w-full sm:w-auto px-8 py-3 text-base font-semibold",
                "bg-coral hover:bg-coral-hover text-white",
                "border border-coral/50 hover:border-coral-hover",
                "shadow-lg shadow-coral/20 hover:shadow-coral/30",
                "transition-all duration-200"
              )}
            >
              <span className="flex items-center gap-2">
                Try Live Evaluation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
