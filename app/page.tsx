"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  AlertCircle,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssessment } from "@/context/AssessmentContext";
import {
  AGENCY_TYPES,
  PAIN_POINTS,
  DATA_CLASSIFICATIONS,
  COMPLIANCE_REQUIREMENTS,
  VOLUME_OPTIONS,
} from "@/lib/constants";
import type { IntakeFormData } from "@/types/assessment";
import { cn } from "@/lib/utils";

const MISSION_PLACEHOLDER =
  "We process 50,000 FOIA requests annually with a 90-day backlog. We need to automate document review and redaction while maintaining compliance with Privacy Act requirements.";

const MAX_MISSION_CHARS = 500;

export default function IntakePage() {
  const router = useRouter();
  const { intake: contextIntake, setIntake, markStepComplete, demoMode } = useAssessment();

  // Pre-populate form from context when demo mode pre-fills the intake
  const [form, setForm] = useState<IntakeFormData>(() =>
    contextIntake.agencyType
      ? contextIntake
      : {
          agencyType: "",
          missionDescription: "",
          painPoints: [],
          dataClassification: "",
          complianceRequirements: [],
          estimatedVolume: "",
        }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof IntakeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track whether context was ever populated (so we can detect a true reset vs. first-time fill)
  const contextWasFilled = useRef(false);

  // Sync local form state after sessionStorage hydration (handles page refresh in demo mode)
  useEffect(() => {
    if (demoMode && contextIntake.agencyType && !form.agencyType) {
      setForm(contextIntake);
    }
  }, [demoMode, contextIntake, form.agencyType]);

  // Clear local form only when context transitions from filled → empty (i.e. after a reset)
  useEffect(() => {
    if (contextIntake.agencyType) {
      contextWasFilled.current = true;
    } else if (contextWasFilled.current && !contextIntake.agencyType) {
      contextWasFilled.current = false;
      setForm({
        agencyType: "",
        missionDescription: "",
        painPoints: [],
        dataClassification: "",
        complianceRequirements: [],
        estimatedVolume: "",
      });
      setErrors({});
    }
  }, [contextIntake.agencyType]);

  const charsRemaining = MAX_MISSION_CHARS - form.missionDescription.length;

  function toggleArrayValue(
    field: "painPoints" | "complianceRequirements",
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof IntakeFormData, string>> = {};

    if (!form.agencyType) {
      newErrors.agencyType = "Please select your agency type.";
    }
    if (form.missionDescription.trim().length < 20) {
      newErrors.missionDescription =
        "Please describe your mission challenge (at least 20 characters).";
    }
    if (!form.dataClassification) {
      newErrors.dataClassification = "Please select a data classification level.";
    }
    if (!form.estimatedVolume) {
      newErrors.estimatedVolume = "Please select an estimated monthly volume.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setIntake(form);
    markStepComplete(0);
    router.push("/assessment");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {demoMode && (
        <div className="bg-[#E07A5F]/10 border-b border-[#E07A5F]/20 px-4 py-2 text-center">
          <span className="text-[#E07A5F] text-xs font-medium">
            Demo Mode — HHS Medicare Eligibility Scenario
          </span>
        </div>
      )}
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-6 py-16">
        {/* Hero section */}
        <div className="mb-12 animate-slide-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-coral animate-pulse" />
            <span className="text-xs font-medium text-coral tracking-wide">
              Federal AI Readiness Assessment
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 lg:text-5xl">
            <span className="block">Claude Federal</span>
            <span className="relative inline-block">
              <span className="relative z-10 text-coral">Readiness</span>
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-coral/60 to-transparent" />
            </span>{" "}
            <span>Assessment</span>
          </h1>

          <p className="mt-4 text-xl text-zinc-400 leading-relaxed max-w-2xl">
            Evaluate how Claude can accelerate your agency&apos;s mission — in
            minutes, not months. Get a tailored architecture recommendation,
            live evaluation, compliance mapping, and implementation roadmap.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-coral" />
              Architecture Recommendation
            </span>
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-coral" />
              Live Evaluation Sandbox
            </span>
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-coral" />
              Compliance Readiness Report
            </span>
            <span className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-coral" />
              Phased Implementation Roadmap
            </span>
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm shadow-2xl shadow-black/40 divide-y divide-zinc-800">

            {/* Section: Agency Context */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10 border border-coral/20">
                  <Building2 className="h-4 w-4 text-coral" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Agency Context
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tell us about your organization
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Agency Type */}
                <div className="space-y-2">
                  <Label
                    htmlFor="agencyType"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Agency Type <span className="text-coral">*</span>
                  </Label>
                  <Select
                    value={form.agencyType}
                    onValueChange={(value) => {
                      setForm((prev) => ({ ...prev, agencyType: value }));
                      setErrors((prev) => ({ ...prev, agencyType: undefined }));
                    }}
                  >
                    <SelectTrigger
                      id="agencyType"
                      className={cn(
                        "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-coral focus:ring-coral/20",
                        errors.agencyType && "border-red-500/70"
                      )}
                    >
                      <SelectValue placeholder="Select your agency type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {AGENCY_TYPES.map((agency) => (
                        <SelectItem
                          key={agency.value}
                          value={agency.value}
                          className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {agency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.agencyType && (
                    <FieldError message={errors.agencyType} />
                  )}
                </div>

                {/* Mission Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="missionDescription"
                      className="text-sm font-medium text-zinc-300"
                    >
                      Mission Challenge{" "}
                      <span className="text-coral">*</span>
                    </Label>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        charsRemaining < 50
                          ? "text-amber-500"
                          : charsRemaining < 0
                          ? "text-red-500"
                          : "text-zinc-600"
                      )}
                    >
                      {charsRemaining} remaining
                    </span>
                  </div>
                  <Textarea
                    id="missionDescription"
                    placeholder={MISSION_PLACEHOLDER}
                    value={form.missionDescription}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, MAX_MISSION_CHARS);
                      setForm((prev) => ({
                        ...prev,
                        missionDescription: value,
                      }));
                      if (errors.missionDescription) {
                        setErrors((prev) => ({
                          ...prev,
                          missionDescription: undefined,
                        }));
                      }
                    }}
                    rows={4}
                    className={cn(
                      "resize-none bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-coral focus:ring-coral/20 text-sm leading-relaxed",
                      errors.missionDescription && "border-red-500/70"
                    )}
                  />
                  {errors.missionDescription && (
                    <FieldError message={errors.missionDescription} />
                  )}
                  <p className="text-xs text-zinc-600">
                    Describe the specific mission challenge, current pain
                    points, and what success looks like.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Pain Points */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Current Pain Points
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Select all that apply to your agency
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PAIN_POINTS.map((point) => {
                  const isChecked = form.painPoints.includes(point.id);
                  return (
                    <label
                      key={point.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-all",
                        isChecked
                          ? "border-coral/40 bg-coral/5 text-zinc-100"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      <Checkbox
                        id={point.id}
                        checked={isChecked}
                        onCheckedChange={() =>
                          toggleArrayValue("painPoints", point.id)
                        }
                        className={cn(
                          "border-zinc-600 data-[state=checked]:bg-coral data-[state=checked]:border-coral",
                          isChecked && "border-coral"
                        )}
                      />
                      <span className="font-medium">{point.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section: Data Classification */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Data Classification Level{" "}
                    <span className="text-coral">*</span>
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Highest classification level of data Claude will process
                  </p>
                </div>
              </div>

              <RadioGroup
                value={form.dataClassification}
                onValueChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    dataClassification: value,
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    dataClassification: undefined,
                  }));
                }}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {DATA_CLASSIFICATIONS.map((classification) => {
                  const isSelected =
                    form.dataClassification === classification.value;
                  return (
                    <label
                      key={classification.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-all",
                        isSelected
                          ? "border-coral/40 bg-coral/5"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      )}
                    >
                      <RadioGroupItem
                        value={classification.value}
                        id={classification.value}
                        className="mt-0.5 border-zinc-600 text-coral"
                      />
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isSelected ? "text-zinc-100" : "text-zinc-300"
                            )}
                          >
                            {classification.label}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
                              classification.badgeColor
                            )}
                          >
                            {classification.badgeLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {classification.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
              {errors.dataClassification && (
                <div className="mt-2">
                  <FieldError message={errors.dataClassification} />
                </div>
              )}
            </div>

            {/* Section: Compliance Requirements */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Compliance Requirements
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Select all applicable compliance frameworks
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {COMPLIANCE_REQUIREMENTS.map((req) => {
                  const isChecked = form.complianceRequirements.includes(req.id);
                  return (
                    <label
                      key={req.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-all",
                        isChecked
                          ? "border-coral/40 bg-coral/5"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                      )}
                    >
                      <Checkbox
                        id={req.id}
                        checked={isChecked}
                        onCheckedChange={() =>
                          toggleArrayValue("complianceRequirements", req.id)
                        }
                        className="border-zinc-600 data-[state=checked]:bg-coral data-[state=checked]:border-coral"
                      />
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isChecked ? "text-zinc-100" : "text-zinc-400"
                          )}
                        >
                          {req.label}
                        </span>
                        {isChecked && (
                          <Badge
                            variant="outline"
                            className="border-coral/30 bg-coral/10 text-coral text-[10px] px-1.5 py-0"
                          >
                            Selected
                          </Badge>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section: Volume */}
            <div className="p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <BarChart3 className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Estimated Monthly Volume{" "}
                    <span className="text-coral">*</span>
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Approximate number of Claude API queries per month
                  </p>
                </div>
              </div>

              <div className="max-w-sm space-y-2">
                <Select
                  value={form.estimatedVolume}
                  onValueChange={(value) => {
                    setForm((prev) => ({ ...prev, estimatedVolume: value }));
                    setErrors((prev) => ({
                      ...prev,
                      estimatedVolume: undefined,
                    }));
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-coral focus:ring-coral/20",
                      errors.estimatedVolume && "border-red-500/70"
                    )}
                  >
                    <SelectValue placeholder="Select monthly volume..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {VOLUME_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.estimatedVolume && (
                  <FieldError message={errors.estimatedVolume} />
                )}
              </div>
            </div>

            {/* Submit section */}
            <div className="px-8 py-6">
              <Separator className="mb-6 bg-zinc-800" />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-zinc-500">
                  <span className="text-coral">*</span> Required fields.
                  Assessment is generated using Claude AI.
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "group relative w-full sm:w-auto px-8 py-3 text-base font-semibold",
                    "bg-coral hover:bg-coral-hover text-white",
                    "border border-coral/50 hover:border-coral-hover",
                    "shadow-lg shadow-coral/20 hover:shadow-coral/30",
                    "transition-all duration-200",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Preparing Assessment...
                      </>
                    ) : (
                      <>
                        Generate Assessment
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}
