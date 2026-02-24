"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  RefreshCw,
  Terminal,
  Zap,
  Lock,
  Play,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAssessment } from "@/context/AssessmentContext";
import { FEDERAL_SCENARIOS } from "@/lib/constants";
import type {
  PerformanceMetrics,
  ScoreResult,
  EvaluationResult,
} from "@/types/assessment";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type ModelKey = "sonnet" | "haiku";
type RunState = "idle" | "streaming" | "scoring" | "complete" | "error";

const MODEL_OPTIONS = [
  {
    key: "sonnet" as ModelKey,
    name: "Sonnet 4.5",
    description: "Best balance",
    price: "$3/1M input",
    available: true,
  },
  {
    key: "haiku" as ModelKey,
    name: "Haiku 4.5",
    description: "Fastest & cheapest",
    price: "$0.25/1M input",
    available: true,
  },
  {
    key: "opus" as const,
    name: "Opus 4.6",
    description: "Enterprise Only",
    price: "$15/1M input",
    available: false,
  },
];

const METADATA_DELIMITER = "\n---METADATA---\n";

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

function scoreStroke(score: number): string {
  if (score >= 90) return "stroke-emerald-400";
  if (score >= 70) return "stroke-amber-400";
  return "stroke-red-400";
}

// SVG circle progress — radius 28, circumference ≈ 175.9
const CIRCUMFERENCE = 2 * Math.PI * 28;

function CircleScore({ label, score }: { label: string; score: number }) {
  const progress = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[72px] w-[72px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-zinc-800"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progress}
            strokeLinecap="round"
            className={cn("transition-all duration-700", scoreStroke(score))}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-sm font-bold",
            scoreColor(score)
          )}
        >
          {score}
        </span>
      </div>
      <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}

function MetricStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      <p className="text-sm font-bold text-zinc-200">{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EvaluatePage() {
  const router = useRouter();
  const { intake, setResults, markStepComplete, isHydrated, demoMode } =
    useAssessment();

  // Left pane state
  const [selectedModel, setSelectedModel] = useState<ModelKey>("sonnet");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    FEDERAL_SCENARIOS[0].id
  );
  const [taskPrompt, setTaskPrompt] = useState<string>(
    FEDERAL_SCENARIOS[0].prompt
  );
  const [userEditedPrompt, setUserEditedPrompt] = useState(false);

  // Right pane state
  const [runState, setRunState] = useState<RunState>("idle");
  const [streamedResponse, setStreamedResponse] = useState("");
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [scores, setScores] = useState<ScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const responseRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  // Guard: redirect to intake if no data (wait for sessionStorage hydration first)
  useEffect(() => {
    if (!isHydrated) return;
    if (!intake.agencyType) {
      router.replace("/");
    }
  }, [intake.agencyType, isHydrated, router]);

  // Keep textarea in sync when scenario changes (unless user manually edited)
  useEffect(() => {
    if (selectedScenarioId === "custom") return;
    if (userEditedPrompt) return;
    const found = FEDERAL_SCENARIOS.find((s) => s.id === selectedScenarioId);
    if (found) setTaskPrompt(found.prompt);
  }, [selectedScenarioId, userEditedPrompt]);

  // Auto-scroll response pane during streaming
  useEffect(() => {
    if (runState === "streaming" && responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedResponse, runState]);

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    setUserEditedPrompt(false);
  };

  const handleTaskPromptChange = (value: string) => {
    setTaskPrompt(value);
    setUserEditedPrompt(true);
    setSelectedScenarioId("custom");
  };

  const resetRightPane = () => {
    setRunState("idle");
    setStreamedResponse("");
    setMetrics(null);
    setScores(null);
    setErrorMessage(null);
    hasMounted.current = false;
  };

  const runEvaluation = useCallback(async () => {
    setRunState("streaming");
    setStreamedResponse("");
    setMetrics(null);
    setScores(null);
    setErrorMessage(null);

    const effectiveScenarioId =
      selectedScenarioId === "custom" ? "custom" : selectedScenarioId;
    const isCustom = selectedScenarioId === "custom";

    try {
      const evalHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (demoMode) evalHeaders["x-demo-mode"] = "true";

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: evalHeaders,
        body: JSON.stringify({
          scenario: effectiveScenarioId,
          customPrompt: isCustom ? taskPrompt : undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const msg =
          response.status === 429
            ? "Rate limit exceeded. Please wait before trying again."
            : (data as { error?: string }).error ?? "Something went wrong.";
        setErrorMessage(msg);
        setRunState("error");
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });

        // Strip metadata from display text while streaming
        const displayText = fullText.includes(METADATA_DELIMITER)
          ? fullText.split(METADATA_DELIMITER)[0]
          : fullText;
        setStreamedResponse(displayText);
      }

      // Parse metadata trailer
      let responseText = fullText;
      let parsedMetrics: PerformanceMetrics | null = null;
      if (fullText.includes(METADATA_DELIMITER)) {
        const parts = fullText.split(METADATA_DELIMITER);
        responseText = parts[0];
        try {
          parsedMetrics = JSON.parse(parts[1]) as PerformanceMetrics;
        } catch {
          console.warn("[EVAL] Failed to parse metadata trailer");
        }
      }

      setMetrics(parsedMetrics);
      setRunState("scoring");

      // Fire scoring API
      const scoreHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (demoMode) scoreHeaders["x-demo-mode"] = "true";

      const scoreResponse = await fetch("/api/evaluate/score", {
        method: "POST",
        headers: scoreHeaders,
        body: JSON.stringify({
          taskPrompt,
          response: responseText,
        }),
      });

      if (!scoreResponse.ok) {
        throw new Error("Scoring API failed");
      }

      const scoreResult: ScoreResult = await scoreResponse.json();
      setScores(scoreResult);
      setRunState("complete");

      // Persist to context for Screen 5
      const scenarioLabel =
        FEDERAL_SCENARIOS.find((s) => s.id === selectedScenarioId)?.label ??
        "Custom Task";
      const evalResult: EvaluationResult = {
        scenarioId: selectedScenarioId,
        scenarioLabel,
        taskPrompt,
        response: responseText,
        modelUsed: selectedModel,
        metrics: parsedMetrics ?? {
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          timeToFirstTokenMs: 0,
          costUsd: 0,
        },
        scores: scoreResult,
      };
      setResults({ evaluation: evalResult });

      if (process.env.NODE_ENV === "development") {
        console.log("[EVAL] /evaluate — complete", {
          overallScore: scoreResult.overallScore,
          model: selectedModel,
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("[EVAL] /evaluate — client error", { message: error.message });
      setErrorMessage("Evaluation failed. Please try again.");
      setRunState("error");
    }
  }, [selectedModel, selectedScenarioId, taskPrompt, setResults, demoMode]);

  function handleContinue() {
    markStepComplete(2);
    router.push("/compliance");
  }

  const isRunning = runState === "streaming" || runState === "scoring";

  // ── Hydration loading state ───────────────────────────────────────────────
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading assessment...</div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {demoMode && (
        <div className="bg-[#E07A5F]/10 border-b border-[#E07A5F]/20 px-4 py-2 text-center">
          <span className="text-[#E07A5F] text-xs font-medium">
            Demo Mode — HHS Medicare Eligibility Scenario
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col lg:flex-row">
      {/* ── LEFT PANE ── */}
      <div className="flex w-full shrink-0 flex-col border-b border-zinc-800 bg-zinc-900/40 lg:w-[40%] lg:border-b-0 lg:border-r lg:overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-7">
          {/* Header */}
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              <span className="text-xs font-medium text-coral tracking-wide">
                Live Evaluation Sandbox
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-50">
              Test Claude on Your Task
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Run a real scenario and get scored results in seconds
            </p>
          </div>

          {/* Model selector */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Select Model
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MODEL_OPTIONS.map((option) => {
                const isSelected =
                  option.available && option.key === selectedModel;
                return (
                  <button
                    key={option.key}
                    onClick={() => {
                      if (option.available && option.key !== "opus") {
                        setSelectedModel(option.key as ModelKey);
                      }
                    }}
                    disabled={!option.available}
                    className={cn(
                      "relative flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                      option.available
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-40",
                      isSelected
                        ? "border-coral/60 bg-coral/10"
                        : option.available
                        ? "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                        : "border-zinc-800 bg-zinc-900"
                    )}
                  >
                    {!option.available && (
                      <span className="absolute -right-1 -top-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400">
                        <Lock className="h-2 w-2" />
                        Enterprise
                      </span>
                    )}
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        isSelected ? "text-coral" : "text-zinc-200"
                      )}
                    >
                      {option.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {option.price}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario selector */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Scenario
            </p>
            <div className="space-y-2">
              {FEDERAL_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleScenarioChange(scenario.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-all",
                    selectedScenarioId === scenario.id
                      ? "border-zinc-600 bg-zinc-800"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  )}
                >
                  <p className="text-sm font-medium text-zinc-200">
                    {scenario.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                    {scenario.description}
                  </p>
                </button>
              ))}
              <button
                onClick={() => handleScenarioChange("custom")}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all",
                  selectedScenarioId === "custom"
                    ? "border-zinc-600 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                )}
              >
                <p className="text-sm font-medium text-zinc-200">
                  Custom Task
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Write your own prompt
                </p>
              </button>
            </div>
          </div>

          {/* Task textarea */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Task Prompt
            </p>
            <Textarea
              value={taskPrompt}
              onChange={(e) => handleTaskPromptChange(e.target.value)}
              rows={8}
              className="resize-none bg-zinc-900 border-zinc-700 text-zinc-200 text-sm font-mono leading-relaxed focus:border-zinc-600 placeholder:text-zinc-600"
              placeholder="Enter a task for Claude to perform..."
            />
          </div>

          {/* Run button */}
          <Button
            onClick={runEvaluation}
            disabled={isRunning || !taskPrompt.trim()}
            className={cn(
              "w-full gap-2 py-3 text-sm font-semibold",
              "bg-coral hover:bg-coral-hover text-white",
              "border border-coral/50 hover:border-coral-hover",
              "shadow-lg shadow-coral/20 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {runState === "scoring" ? "Scoring..." : "Running..."}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Evaluation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── RIGHT PANE ── */}
      <div
        ref={responseRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="p-6 lg:p-8 space-y-5 min-h-full">
          {/* ── IDLE STATE ── */}
          {runState === "idle" && (
            <div className="flex h-full min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                  <Terminal className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-base font-medium text-zinc-400">
                  Ready to evaluate
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Select a scenario and click Run Evaluation
                </p>
              </div>
            </div>
          )}

          {/* ── STREAMING / SCORING STATE ── */}
          {(runState === "streaming" || runState === "scoring") && (
            <div className="space-y-4">
              {/* Streaming header */}
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-50" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  {runState === "scoring"
                    ? "Scoring response with Haiku..."
                    : "Claude is responding..."}
                </p>
              </div>

              {/* Live response */}
              {streamedResponse && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="prose prose-sm prose-invert max-w-none text-zinc-300 [&_h1]:text-zinc-100 [&_h2]:text-zinc-100 [&_h3]:text-zinc-200 [&_strong]:text-zinc-200 [&_code]:text-coral [&_code]:bg-zinc-900 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_ul]:text-zinc-300 [&_ol]:text-zinc-300 [&_li]:text-zinc-300">
                    <ReactMarkdown>{streamedResponse}</ReactMarkdown>
                    {runState === "streaming" && (
                      <span className="inline-block h-3.5 w-0.5 animate-pulse bg-coral ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              )}

              {/* Scoring spinner */}
              {runState === "scoring" && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
                  <p className="text-sm text-zinc-500">
                    Analyzing response quality with Claude Haiku...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {runState === "error" && (
            <div className="rounded-xl border border-red-500/20 bg-zinc-900/60 p-8 text-center">
              <p className="text-sm font-semibold text-red-400">
                Evaluation failed
              </p>
              <p className="mt-1 text-sm text-zinc-500">{errorMessage}</p>
              <Button
                onClick={resetRightPane}
                variant="outline"
                className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* ── COMPLETE STATE ── */}
          {runState === "complete" && scores && (
            <div className="space-y-5">
              {/* Claude's Response */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-coral to-coral/30" />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-coral" />
                    <h2 className="text-sm font-semibold text-zinc-200">
                      Claude&apos;s Response
                    </h2>
                    <span className="ml-auto text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                      {selectedModel === "haiku" ? "Haiku 4.5" : "Sonnet 4.5"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 max-h-64 overflow-y-auto">
                    <div className="prose prose-sm prose-invert max-w-none [&_h1]:text-zinc-100 [&_h2]:text-zinc-100 [&_h3]:text-zinc-200 [&_strong]:text-zinc-200 [&_code]:text-coral [&_code]:bg-zinc-900 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_ul]:text-zinc-300 [&_ol]:text-zinc-300 [&_li]:text-zinc-300">
                      <ReactMarkdown>{streamedResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evaluation Scorecard */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-200">
                    Evaluation Scorecard
                  </h2>
                </div>

                {/* Overall score */}
                <div className="mb-6 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">
                    Overall Score
                  </p>
                  <p
                    className={cn(
                      "text-6xl font-bold tabular-nums",
                      scoreColor(scores.overallScore)
                    )}
                  >
                    {scores.overallScore}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">out of 100</p>
                </div>

                {/* 4 circle scores */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <CircleScore
                    label="Accuracy"
                    score={scores.scores.accuracy.score}
                  />
                  <CircleScore
                    label="Complete"
                    score={scores.scores.completeness.score}
                  />
                  <CircleScore
                    label="Safety"
                    score={scores.scores.safety.score}
                  />
                  <CircleScore
                    label="Tone"
                    score={scores.scores.tone.score}
                  />
                </div>

                {/* Score explanations */}
                <div className="mb-5 space-y-2">
                  {(
                    [
                      ["Accuracy", scores.scores.accuracy.explanation],
                      ["Completeness", scores.scores.completeness.explanation],
                      ["Safety", scores.scores.safety.explanation],
                      ["Tone", scores.scores.tone.explanation],
                    ] as [string, string][]
                  ).map(([dim, explanation]) => (
                    <div key={dim} className="flex gap-2 text-xs">
                      <span className="shrink-0 font-semibold text-zinc-500 w-20">
                        {dim}
                      </span>
                      <span className="text-zinc-400">{explanation}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-zinc-800 mb-4" />

                {/* Summary */}
                <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                  {scores.summary}
                </p>

                {/* Strengths */}
                {scores.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Strengths
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {scores.strengths.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {scores.improvements.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Areas for Improvement
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {scores.improvements.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              {metrics && (
                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" />
                    Performance Metrics
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    <MetricStat
                      label="First Token"
                      value={`${metrics.timeToFirstTokenMs}ms`}
                    />
                    <MetricStat
                      label="Total Latency"
                      value={`${(metrics.latencyMs / 1000).toFixed(1)}s`}
                    />
                    <MetricStat
                      label="Input Tokens"
                      value={metrics.inputTokens.toLocaleString()}
                    />
                    <MetricStat
                      label="Output Tokens"
                      value={metrics.outputTokens.toLocaleString()}
                    />
                    <MetricStat
                      label="Cost"
                      value={`$${metrics.costUsd < 0.001 ? metrics.costUsd.toFixed(5) : metrics.costUsd.toFixed(4)}`}
                    />
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <Separator className="bg-zinc-800" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={resetRightPane}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Run Again
                </Button>
                <Button
                  onClick={handleContinue}
                  className={cn(
                    "group gap-2 px-6 py-2.5 text-sm font-semibold",
                    "bg-coral hover:bg-coral-hover text-white",
                    "border border-coral/50 shadow-lg shadow-coral/20",
                    "transition-all duration-200"
                  )}
                >
                  View Compliance Mapping
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
