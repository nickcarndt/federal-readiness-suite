# Federal capability notes (source of truth for prompts)

Keep `lib/prompts.ts` aligned with these notes. Do not overclaim authorization scope.

## What is accurate (as of public announcements, mid-2025)

- Claude models on **Amazon Bedrock in AWS GovCloud (US)** received approval for use in **FedRAMP High** and **DoD IL4/IL5** workloads (Anthropic + AWS announcements, June 2025).
- Authorization is **pathway- and model-version-specific**. Do not claim that every Claude model ID (e.g. latest Sonnet) is automatically covered — agency ATO packages must pin approved model versions and inheritance paths.
- **Direct Anthropic API** is appropriate for many Unclassified / CUI commercial-cloud patterns with enterprise controls (ZDR, SSO, etc.), but is **not** a substitute for GovCloud FedRAMP High inheritance when that boundary is required.
- Anthropic has also announced Claude availability on **Google Cloud Vertex AI** for certain FedRAMP High / IL2 workloads. Do **not** say Vertex lacks FedRAMP High entirely.

## Classification gate (product rule)

- This demo supports **Unclassified / CUI** and **FOUO** pathways only.
- **Secret** and **Top Secret / SCI** are refused at the UI and API. Classified workloads require separate authorized environments beyond this assessment tool's scope.

## Sources (public)

- Anthropic: “Claude in Amazon Bedrock: Approved for Use in FedRAMP High and DoD IL4/5 Workloads” (June 2025)
- AWS Public Sector / What’s New posts on Bedrock GovCloud FedRAMP High + DoD IL4/5 (2025)
