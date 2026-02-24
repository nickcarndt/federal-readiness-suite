"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Download,
  KeyRound,
  Users,
  ScrollText,
  ShieldOff,
  Lock,
  Server,
  ArrowRightIcon,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAssessment } from "@/context/AssessmentContext";
import {
  COMPLIANCE_REQUIREMENTS,
  COMPLIANCE_STATUS,
  AGENCY_TYPES,
  DATA_CLASSIFICATIONS,
} from "@/lib/constants";
import type { ComplianceStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { generateComplianceReport } from "@/lib/pdf-export";
import type { ComplianceStatus } from "@/types/assessment";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AtoItem {
  title: string;
  description: string;
}

interface SecurityCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const ALWAYS_SHOWN = ["fedramp-high", "fisma"];

const ATO_ITEMS: AtoItem[] = [
  {
    title: "Identify sponsoring agency Authorizing Official (AO)",
    description:
      "Designate the senior agency official who will grant and maintain the ATO for Claude deployment.",
  },
  {
    title: "Inherit FedRAMP High controls from AWS GovCloud authorization",
    description:
      "Leverage AWS GovCloud's existing FedRAMP High P-ATO to inherit ~60% of required security controls.",
  },
  {
    title: "Complete agency-specific control overlay requirements",
    description:
      "Document agency-specific implementations for the remaining inherited and hybrid controls.",
  },
  {
    title: "Conduct penetration testing on integration points",
    description:
      "Third-party pen test covering the API integration layer, MCP connections, and agency boundary.",
  },
  {
    title: "Submit ATO package to agency CISO",
    description:
      "Compile System Security Plan (SSP), SAR, POA&M, and supporting artifacts for CISO review.",
  },
  {
    title: "Achieve ATO and begin production deployment",
    description:
      "Upon AO signature, proceed to production cutover with continuous monitoring in place.",
  },
];

const SECURITY_CARDS: SecurityCard[] = [
  {
    icon: <KeyRound className="h-5 w-5 text-coral" />,
    title: "SSO / SAML Integration",
    description:
      "Connect to your agency identity provider for seamless authentication and single sign-on.",
  },
  {
    icon: <Users className="h-5 w-5 text-coral" />,
    title: "Role-Based Access Control",
    description:
      "Granular permissions for different user groups and classification levels.",
  },
  {
    icon: <ScrollText className="h-5 w-5 text-coral" />,
    title: "Audit Logging & Monitoring",
    description:
      "Complete audit trail of all API interactions for compliance reporting and forensics.",
  },
  {
    icon: <ShieldOff className="h-5 w-5 text-coral" />,
    title: "Data Loss Prevention",
    description:
      "Configurable DLP controls to prevent sensitive data exfiltration via prompt injection.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusConfig(status: ComplianceStatusValue): {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "authorized":
      return {
        label: "Authorized",
        badgeClass:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      };
    case "partial":
      return {
        label: "Partial",
        badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
    case "conditional":
      return {
        label: "Conditional",
        badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        icon: <Info className="h-3.5 w-3.5" />,
      };
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const router = useRouter();
  const { intake, markStepComplete, isHydrated, demoMode } = useAssessment();

  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    Array(ATO_ITEMS.length).fill(false)
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!intake.agencyType) {
      router.replace("/");
    }
  }, [intake.agencyType, isHydrated, router]);

  const agencyLabel =
    AGENCY_TYPES.find((a) => a.value === intake.agencyType)?.label ??
    intake.agencyType;

  const classificationInfo = DATA_CLASSIFICATIONS.find(
    (d) => d.value === intake.dataClassification
  );

  // Build deduplicated matrix rows: always show fedramp-high + fisma first
  const matrixIds = [
    ...ALWAYS_SHOWN,
    ...intake.complianceRequirements.filter((id) => !ALWAYS_SHOWN.includes(id)),
  ];

  const checkedCount = checkedItems.filter(Boolean).length;

  function toggleItem(index: number) {
    setCheckedItems((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  function handleContinue() {
    markStepComplete(3);
    router.push("/roadmap");
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading assessment...</div>
      </div>
    );
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
    <div className="px-6 py-10 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-coral/20 bg-coral/5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="text-xs font-medium text-coral tracking-wide">
              Compliance & Security Posture
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-50 lg:text-4xl">
                Compliance Readiness
              </h1>
              <p className="mt-1 text-lg text-zinc-400">for {agencyLabel}</p>
            </div>
            {classificationInfo && (
              <span
                className={cn(
                  "inline-flex items-center self-start rounded-md border px-2.5 py-1 text-xs font-bold tracking-wider",
                  classificationInfo.badgeColor
                )}
              >
                {classificationInfo.badgeLabel}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm text-zinc-500">
            Claude&apos;s compliance posture against your selected frameworks.
            Statuses reflect Claude deployed via AWS Bedrock GovCloud —
            the recommended pathway for federal deployments.
          </p>
        </div>

        {/* ── SECTION 1: COMPLIANCE MATRIX ────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-coral" />
              <h2 className="text-sm font-semibold text-zinc-200">
                Compliance Matrix
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              FedRAMP High and FISMA shown as baseline. Remaining frameworks from your intake selection.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Framework
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Status
                </th>
                <th className="hidden px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-600 md:table-cell">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {matrixIds.map((id, i) => {
                const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === id);
                const entry =
                  COMPLIANCE_STATUS[id as keyof typeof COMPLIANCE_STATUS];
                if (!entry) return null;
                const { label, badgeClass, icon } = statusConfig(
                  entry.status as ComplianceStatusValue
                );
                const isBaseline = ALWAYS_SHOWN.includes(id);
                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-b border-zinc-800/60 transition-colors",
                      i % 2 === 0 ? "bg-zinc-950/40" : "bg-zinc-900/20"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200">
                          {req?.label ?? id}
                        </span>
                        {isBaseline && (
                          <span className="hidden rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
                            Baseline
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                          badgeClass
                        )}
                      >
                        {icon}
                        {label}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-zinc-400 md:table-cell">
                      {entry.detail}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 border-t border-zinc-800 bg-zinc-900/20 px-6 py-3">
            {(
              [
                { status: "authorized" as ComplianceStatusValue, desc: "Full compliance achieved" },
                { status: "partial" as ComplianceStatusValue, desc: "Agency action required" },
                { status: "conditional" as ComplianceStatusValue, desc: "Achievable with addendum" },
              ] as { status: ComplianceStatusValue; desc: string }[]
            ).map(({ status, desc }) => {
              const cfg = statusConfig(status);
              return (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                      cfg.badgeClass
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-zinc-600">{desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: DATA RESIDENCY & ENCRYPTION ──────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-coral" />
              <h2 className="text-sm font-semibold text-zinc-200">
                Data Residency & Encryption
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              All data processed within the FedRAMP High authorization boundary. Zero data retention by default on Enterprise plans.
            </p>
          </div>
          <div className="p-6 space-y-6">
            {/* GovCloud region cards inside FedRAMP boundary */}
            <div
              className="rounded-lg border-2 border-dashed border-blue-500/30 bg-blue-500/5 p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  FedRAMP High Authorization Boundary
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    region: "us-gov-west-1",
                    label: "AWS GovCloud US-West",
                    note: "Primary region — FedRAMP High authorized",
                  },
                  {
                    region: "us-gov-east-1",
                    label: "AWS GovCloud US-East",
                    note: "DR failover region — same authorization scope",
                  },
                ].map((r) => (
                  <div
                    key={r.region}
                    className="flex items-start gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
                      <Server className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {r.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        {r.region}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{r.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security badges */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: <Lock className="h-4 w-4 text-emerald-400" />,
                  label: "AES-256 at Rest",
                  sub: "All stored data encrypted",
                },
                {
                  icon: <Zap className="h-4 w-4 text-emerald-400" />,
                  label: "TLS 1.3 in Transit",
                  sub: "End-to-end encryption",
                },
                {
                  icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
                  label: "Zero Data Retention",
                  sub: "Prompts & responses not stored",
                },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
                >
                  {badge.icon}
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      {badge.label}
                    </p>
                    <p className="text-[10px] text-zinc-500">{badge.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Data flow strip */}
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Data Flow
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs">
                {[
                  { label: "Agency System", sub: "Request origin" },
                  null,
                  { label: "Encrypted Transit", sub: "TLS 1.3" },
                  null,
                  { label: "GovCloud Boundary", sub: "FedRAMP High" },
                  null,
                  { label: "Claude (Bedrock)", sub: "No data retained" },
                  null,
                  { label: "Response", sub: "Returned to agency" },
                ].map((item, i) => {
                  if (item === null) {
                    return (
                      <ArrowRightIcon
                        key={`arrow-${i}`}
                        className="h-3 w-3 shrink-0 text-zinc-700"
                      />
                    );
                  }
                  return (
                    <div key={item.label} className="flex flex-col items-center">
                      <span className="font-medium text-zinc-300">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {item.sub}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: ATO ACCELERATION CHECKLIST ───────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-coral" />
                  <h2 className="text-sm font-semibold text-zinc-200">
                    Authority to Operate — Accelerated Path
                  </h2>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Inheriting FedRAMP High controls saves ~60% of control assessment effort
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  {checkedCount} of {ATO_ITEMS.length} complete
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                  Typical: 3–6 months vs 12–18 from scratch
                </span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-zinc-800/60">
            {ATO_ITEMS.map((item, i) => (
              <button
                key={item.title}
                onClick={() => toggleItem(i)}
                className={cn(
                  "w-full px-6 py-4 text-left transition-colors hover:bg-zinc-800/30",
                  checkedItems[i] && "bg-emerald-500/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                      checkedItems[i]
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-600 bg-zinc-900"
                    )}
                  >
                    {checkedItems[i] && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        checkedItems[i]
                          ? "text-zinc-500 line-through decoration-zinc-600"
                          : "text-zinc-200"
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">
                    Step {i + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="border-t border-zinc-800 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(checkedCount / ATO_ITEMS.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-zinc-500">
                {Math.round((checkedCount / ATO_ITEMS.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: SECURITY ARCHITECTURE ────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-coral" />
              <h2 className="text-sm font-semibold text-zinc-200">
                Security Architecture Highlights
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Enterprise security controls available for production deployments
            </p>
          </div>
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
            {SECURITY_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={cn(
                  "flex items-start gap-4 p-6 transition-colors hover:bg-zinc-800/20",
                  i === 0 && "sm:border-b sm:border-r border-zinc-800/60",
                  i === 1 && "sm:border-b border-zinc-800/60",
                  i === 2 && "sm:border-r border-zinc-800/60",
                  "border-b border-zinc-800/60 last:border-b-0"
                )}
              >
                <div className="w-1 self-stretch rounded-full bg-coral/40 shrink-0" />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {card.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER CTAs ──────────────────────────────────────────────────── */}
        <Separator className="bg-zinc-800" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <Button
            onClick={() => {
              const complianceArray: ComplianceStatus[] = matrixIds.map((id) => {
                const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === id);
                const entry = COMPLIANCE_STATUS[id as keyof typeof COMPLIANCE_STATUS];
                return {
                  framework: req?.label ?? id,
                  status: (entry?.status ?? "conditional") as ComplianceStatus["status"],
                  detail: entry?.detail ?? "",
                };
              });
              generateComplianceReport(intake, complianceArray);
            }}
            variant="outline"
            className="gap-2 border-coral/30 text-coral hover:bg-coral/10 hover:border-coral/50"
          >
            <Download className="h-4 w-4" />
            Export Compliance Report
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
            View Implementation Roadmap
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

      </div>
    </div>
    </div>
  );
}
