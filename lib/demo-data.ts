import type { IntakeFormData, AssessmentResults } from "@/types/assessment";

// Full HHS Medicare eligibility scenario — pre-configured for the demo button.
// Values must match the IDs defined in lib/constants.ts (not display labels).
export const DEMO_INTAKE: IntakeFormData = {
  agencyType: "hhs",
  missionDescription:
    "We process over 2 million Medicare eligibility determinations annually across 50+ regional offices. Claims processors manually review medical records, cross-reference policy databases, and draft determination letters — averaging 45 days per case against a 30-day SLA. We need to automate document analysis, eligibility reasoning, and letter generation while maintaining HIPAA compliance and audit traceability.",
  painPoints: [
    "manual-processing",
    "slow-response",
    "staffing",
    "compliance-burden",
    "legacy-systems",
  ],
  dataClassification: "unclassified-cui",
  complianceRequirements: [
    "fedramp-high",
    "fisma",
    "hipaa",
    "section-508",
    "privacy-act",
  ],
  estimatedVolume: "100k-1m",
};

// Populate with cached results after a real run-through to enable instant Quick Tour
export const DEMO_RESULTS: AssessmentResults = {
  architecture: undefined,
  evaluation: undefined,
  roadmap: undefined,
};

// All 5 steps complete (0-indexed): Intake, Architecture, Evaluation, Compliance, Roadmap
export const DEMO_COMPLETED_STEPS = [0, 1, 2, 3, 4];
