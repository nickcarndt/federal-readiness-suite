export const STEPS = [
  { label: "Intake", route: "/" },
  { label: "Architecture", route: "/assessment" },
  { label: "Evaluation", route: "/evaluate" },
  { label: "Compliance", route: "/compliance" },
  { label: "Roadmap", route: "/roadmap" },
] as const;

export const AGENCY_TYPES = [
  { value: "dod", label: "DoD — Department of Defense" },
  { value: "hhs", label: "Civilian — HHS" },
  { value: "dhs", label: "Civilian — DHS" },
  { value: "doj", label: "Civilian — DOJ" },
  { value: "treasury", label: "Civilian — Treasury" },
  { value: "state", label: "Civilian — State" },
  { value: "va", label: "Civilian — VA" },
  { value: "intelligence", label: "Intelligence Community" },
  { value: "legislative", label: "Legislative Branch" },
  { value: "judicial", label: "Judicial Branch" },
] as const;

export const PAIN_POINTS = [
  { id: "manual-processing", label: "Manual document processing" },
  { id: "slow-response", label: "Slow response times" },
  { id: "staffing", label: "Staffing constraints" },
  { id: "legacy-systems", label: "Legacy system limitations" },
  { id: "compliance-burden", label: "Compliance burden" },
  { id: "cross-agency", label: "Cross-agency coordination" },
  { id: "data-silos", label: "Data silos" },
  { id: "citizen-experience", label: "Citizen experience gaps" },
] as const;

export const DATA_CLASSIFICATIONS = [
  {
    value: "unclassified-cui",
    label: "Unclassified / CUI",
    badgeLabel: "CUI",
    description: "Controlled Unclassified Information",
    badgeColor: "bg-emerald-900/40 text-emerald-400 border-emerald-700",
  },
  {
    value: "fouo",
    label: "FOUO",
    badgeLabel: "FOUO",
    description: "For Official Use Only",
    badgeColor: "bg-yellow-900/40 text-yellow-400 border-yellow-700",
  },
  {
    value: "secret",
    label: "Secret",
    badgeLabel: "SECRET",
    description: "Classified — Secret",
    badgeColor: "bg-orange-900/40 text-orange-400 border-orange-700",
  },
  {
    value: "top-secret",
    label: "Top Secret / SCI",
    badgeLabel: "TS/SCI",
    description: "Classified — TS/SCI",
    badgeColor: "bg-red-900/40 text-red-400 border-red-700",
  },
] as const;

export const COMPLIANCE_REQUIREMENTS = [
  { id: "fedramp-high", label: "FedRAMP High" },
  { id: "fisma", label: "FISMA" },
  { id: "hipaa", label: "HIPAA" },
  { id: "section-508", label: "Section 508 Accessibility" },
  { id: "privacy-act", label: "Privacy Act" },
  { id: "itar", label: "ITAR" },
  { id: "cjis", label: "CJIS" },
  { id: "soc2", label: "SOC 2 Type II" },
] as const;

export const VOLUME_OPTIONS = [
  { value: "under-1k", label: "< 1,000 queries / month" },
  { value: "1k-10k", label: "1,000 – 10,000 / month" },
  { value: "10k-100k", label: "10,000 – 100,000 / month" },
  { value: "100k-1m", label: "100,000 – 1M / month" },
  { value: "over-1m", label: "1M+ / month" },
] as const;

export const CLAUDE_MODELS = {
  sonnet: "claude-sonnet-4-5-20250929",
  haiku: "claude-haiku-4-5-20251001",
} as const;

export const CLAUDE_MODEL_PRICING = {
  sonnet: { inputPerMillion: 3, outputPerMillion: 15 },
  haiku: { inputPerMillion: 0.25, outputPerMillion: 1.25 },
} as const;

export const COMPLIANCE_STATUS = {
  "fedramp-high": {
    status: "authorized" as const,
    detail: "Via AWS GovCloud, authorized June 2025",
    icon: "check" as const,
  },
  "fisma": {
    status: "authorized" as const,
    detail: "Inherited controls via FedRAMP High authorization",
    icon: "check" as const,
  },
  "hipaa": {
    status: "authorized" as const,
    detail: "BAA available on Enterprise plans",
    icon: "check" as const,
  },
  "soc2": {
    status: "authorized" as const,
    detail: "Anthropic SOC 2 Type II certified",
    icon: "check" as const,
  },
  "section-508": {
    status: "partial" as const,
    detail: "API responses require agency-side accessible rendering",
    icon: "warning" as const,
  },
  "privacy-act": {
    status: "authorized" as const,
    detail: "Zero data retention option available",
    icon: "check" as const,
  },
  "nist-ai-rmf": {
    status: "authorized" as const,
    detail: "Claude development follows NIST AI Risk Management Framework",
    icon: "check" as const,
  },
  "cjis": {
    status: "conditional" as const,
    detail: "Achievable via AWS GovCloud with CJIS Security Addendum",
    icon: "warning" as const,
  },
  "itar": {
    status: "conditional" as const,
    detail: "Requires agency-specific data handling agreement",
    icon: "warning" as const,
  },
} as const;

export type ComplianceStatusKey = keyof typeof COMPLIANCE_STATUS;
export type ComplianceStatusValue = "authorized" | "partial" | "conditional";

export const FEDERAL_SCENARIOS = [
  {
    id: "foia-redaction",
    label: "FOIA Request Processing",
    description: "Review a document and identify information requiring redaction under FOIA exemptions",
    prompt: `You are processing a FOIA request for the Department of Homeland Security. The following document excerpt is from an internal threat assessment report. Identify all information that should be redacted under FOIA Exemptions 1 (national security), 6 (personal privacy), and 7(E) (law enforcement techniques). For each redaction, specify the exemption number and briefly explain why.

---
INTERNAL MEMO — DHS/I&A
Date: October 15, 2025
From: Senior Intelligence Analyst James Morrison (james.morrison@dhs.gov)
Subject: Emerging Threat Pattern — Port of Long Beach

Based on SIGINT collection from NSA reporting (TS//SI//NOFORN downgraded to FOUO), we have identified a pattern of suspicious cargo manifests originating from three shell companies linked to PRC-affiliated entities. The companies — Evergreen Pacific Trading (EIN: 84-2947361), Shenzhen Maritime LLC, and Golden Dragon Imports — have collectively shipped 47 containers through Long Beach in the past 90 days.

Our HUMINT source (designated COASTWATCH-7) reports that dock workers at Terminal G have observed unusual overnight loading operations. CBP Officer Sarah Chen (badge #4471) has flagged 12 of these shipments for secondary inspection.

Recommendation: Coordinate with FBI JTTF Los Angeles and CBP targeting center. Deploy mobile NII (non-intrusive inspection) assets to Terminal G during the November 1-15 window.
---`,
    agencyTypes: ["all"],
  },
  {
    id: "policy-analysis",
    label: "Policy Document Analysis",
    description: "Extract key requirements and obligations from a federal regulation",
    prompt: `Extract all mandatory requirements (indicated by 'shall', 'must', 'required') from the following excerpt of a proposed federal regulation. For each requirement, identify: (1) who is obligated, (2) what they must do, (3) the deadline or trigger condition, and (4) any exceptions or waivers mentioned.

---
SEC. 4. AI SYSTEM TRANSPARENCY REQUIREMENTS.

(a) DISCLOSURE.—Each covered agency shall, not later than 180 days after the date of enactment of this Act, publish on its public website a complete inventory of all artificial intelligence systems in operational use, including—
(1) the purpose and intended use of each system;
(2) the training data sources, to the extent not classified;
(3) the assessed risk level under the framework established in subsection (c).

(b) IMPACT ASSESSMENTS.—Before deploying any AI system that makes or materially supports decisions affecting individual rights, benefits, or access to government services, the head of each covered agency must—
(1) complete an algorithmic impact assessment consistent with NIST AI RMF standards;
(2) provide a 30-day public comment period for high-risk systems;
(3) submit the assessment to the agency Inspector General and to the Director of OMB.

(c) EXCEPTIONS.—The requirements of subsections (a) and (b) shall not apply to AI systems used exclusively for—
(1) internal IT operations and cybersecurity defense;
(2) intelligence activities conducted under Executive Order 12333;
(3) systems with fewer than 100 monthly interactions with members of the public.
---`,
    agencyTypes: ["all"],
  },
  {
    id: "constituent-response",
    label: "Constituent Inquiry Response",
    description: "Draft a professional response to a citizen letter",
    prompt: `Draft a response letter on behalf of the Department of Veterans Affairs to the following constituent inquiry. The response should be empathetic, accurate, reference specific VA programs where applicable, and include next steps the veteran can take. Use appropriate government letter formatting.

---
Dear VA,

My name is Robert Hernandez and I served in the Marine Corps from 2003 to 2011, including two deployments to Iraq (Fallujah 2004, Ramadi 2006). I was honorably discharged as a Sergeant (E-5).

I've been struggling with PTSD symptoms for years but was too proud to ask for help. Last month I finally went to the VA clinic in Phoenix and they told me I needed to file a claim for service-connected disability, but the process seems impossible. I filled out some forms but I don't understand what evidence I need or how long this will take. I'm also worried because I waited so long — does that mean I can't get benefits?

I'm currently unemployed and having trouble keeping a job because of my symptoms. My wife says I should also ask about vocational rehabilitation but I don't know if I qualify.

Any help would be appreciated.

Respectfully,
Robert Hernandez
Phoenix, AZ
---`,
    agencyTypes: ["all"],
  },
  {
    id: "contract-review",
    label: "Contract Review",
    description: "Identify key terms, risks, and compliance issues in a federal contract",
    prompt: `Review the following federal contract excerpt and identify: (1) key performance obligations, (2) potential risks to the agency, (3) FAR/DFARS compliance concerns, (4) any terms that are unusual or potentially unfavorable. Provide a risk rating (Low/Medium/High) for each finding.

---
TASK ORDER 47QFCA-24-F-0089
Agency: General Services Administration (GSA)
Contractor: NovaTech Solutions Inc.
Contract Vehicle: OASIS+ SB Pool 1
Period of Performance: Base year + 4 option years
Ceiling: $12,400,000

C.3 SCOPE OF WORK
The Contractor shall provide artificial intelligence and machine learning services to support GSA's Federal Acquisition Service (FAS) in automating category management analytics. This includes:
(a) Development and deployment of ML models for spend analysis across all federal procurement data
(b) Real-time anomaly detection for pricing irregularities
(c) Natural language processing of contract documents for clause extraction and compliance checking

C.4 DATA RIGHTS
All models, algorithms, and derivative works developed under this task order shall be the exclusive property of the Government with unlimited rights per FAR 52.227-14. The Contractor grants the Government a perpetual, irrevocable license to all pre-existing intellectual property incorporated into deliverables.

C.7 PERSONNEL
The Contractor's Key Personnel (Program Manager and Lead Data Scientist) shall not be substituted without 30 days prior written approval. The Government reserves the right to approve all personnel security clearances. Contractor personnel shall complete annual cybersecurity awareness training per FISMA requirements.

C.9 SERVICE LEVEL AGREEMENTS
System availability: 99.5% measured monthly. Response time for anomaly alerts: <15 minutes during business hours. Model retraining: quarterly at minimum, with accuracy benchmarks maintaining >92% precision on test datasets.
---`,
    agencyTypes: ["all"],
  },
  {
    id: "data-extraction",
    label: "Data Extraction",
    description: "Pull structured data from an unstructured federal report",
    prompt: `Extract all quantitative data points from the following agency report excerpt into a structured table format. For each data point, capture: (1) metric name, (2) value, (3) time period, (4) comparison/trend if mentioned, (5) source/context. Flag any data points that appear inconsistent or potentially erroneous.

---
FY2025 Q3 PERFORMANCE REPORT — USCIS IMMIGRATION SERVICES

Processing times for Form I-485 (Adjustment of Status) decreased from 11.2 months in Q2 to 9.8 months in Q3, a 12.5% improvement attributed to the new AI-assisted document review pilot. However, the Nebraska Service Center reported a contradictory increase to 13.1 months due to staffing shortages affecting 23% of adjudication officers.

Naturalization ceremonies processed 224,300 new citizens in Q3, up from 198,750 in Q2 (12.9% increase). The online naturalization test pilot program, launched in 47 field offices, showed a 94.2% pass rate compared to the national average of 91.7% for in-person testing.

Fraud detection rates improved significantly: the FDNS (Fraud Detection and National Security) directorate identified 3,847 suspected fraud cases in Q3 versus 2,912 in Q2, a 32.1% increase. Of these, 2,103 were related to employment-based petitions and 891 to family-based filings. Approximately $14.2 million in fraudulent benefits were prevented, though this figure likely underestimates the true impact by 40-60% according to the OIG.

Backlog reduction targets remain challenging: total pending cases stand at 8.3 million, down from 8.7 million at the start of FY2025 but still 2.1 million above the FY2019 baseline of 6.2 million. The agency projects reaching 7.0 million by end of FY2026 assuming current staffing levels and no policy changes.
---`,
    agencyTypes: ["all"],
  },
] as const;
