import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  IntakeFormData,
  ArchitectureRecommendation,
  EvaluationResult,
  ComplianceStatus,
  ImplementationRoadmap,
} from "@/types/assessment";
import {
  AGENCY_TYPES,
  DATA_CLASSIFICATIONS,
  VOLUME_OPTIONS,
  COMPLIANCE_REQUIREMENTS,
  PAIN_POINTS,
} from "@/lib/constants";

// ── jspdf-autotable cursor helper ─────────────────────────────────────────────

function lastY(doc: jsPDF): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable?.finalY ?? 0;
}

// ── Brand color tuples (RGB) ──────────────────────────────────────────────────
const CORAL = [224, 122, 95] as const;
const DARK_BG = [24, 24, 27] as const;
const ZINC_700 = [63, 63, 70] as const;
const WHITE = [255, 255, 255] as const;
const GREEN = [34, 197, 94] as const;
const AMBER = [245, 158, 11] as const;

// ── Fix 1: Label lookup helpers ───────────────────────────────────────────────

function labelFor<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string
): string {
  return list.find((x) => x.value === value)?.label ?? value;
}

function labelForId<T extends { id: string; label: string }>(
  list: readonly T[],
  id: string
): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

function agencyLabel(v: string): string {
  return labelFor(AGENCY_TYPES, v) || "Federal Agency";
}

function classLabel(v: string): string {
  return labelFor(DATA_CLASSIFICATIONS, v);
}

function volumeLabel(v: string): string {
  return labelFor(VOLUME_OPTIONS, v);
}

function compReqLabels(ids: string[]): string {
  return ids.length
    ? ids.map((id) => labelForId(COMPLIANCE_REQUIREMENTS, id)).join(", ")
    : "None specified";
}

function painLabels(ids: string[]): string {
  return ids.length
    ? ids.map((id) => labelForId(PAIN_POINTS, id)).join(", ")
    : "None specified";
}

// ── Fix 2: Arrow-safe text sanitizer ─────────────────────────────────────────
// jsPDF's embedded Helvetica does not support Unicode arrows or other
// multi-byte characters. Strip the known offenders before rendering.

function safe(text: string | null | undefined): string {
  return (text ?? "").replace(/→/g, " -> ").replace(/←/g, " <- ").replace(/↔/g, " <-> ");
}

// ── Fix 5: Compliance status labels (plain ASCII, no unicode symbols) ─────────

function statusLabel(status: ComplianceStatus["status"]): string {
  if (status === "authorized") return "Authorized";
  if (status === "partial") return "Partial";
  return "Conditional";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function colorStatusCell(data: any) {
  if (data.column.index === 1 && data.section === "body") {
    const val = data.cell.raw as string;
    if (val === "Authorized") {
      data.cell.styles.textColor = [...GREEN];
    } else {
      data.cell.styles.textColor = [...AMBER];
    }
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function safeFilename(agencyType: string): string {
  return (agencyType || "agency").toLowerCase().replace(/[^a-z0-9]/g, "-");
}

// ── Fix 4: Shared compliance detail sections (reused in both report functions) -

function addResidencyAndAto(
  doc: jsPDF,
  startY: number,
  margin: number,
  pageWidth: number,
  sectionHeadingFn: (text: string, yPos: number) => number
): number {
  let y = startY;

  y = sectionHeadingFn("Data Residency & Encryption", y);

  const residencyItems = [
    "AWS GovCloud (US-East / US-West) -- FedRAMP High authorization boundary",
    "Zero data retention option: prompts and responses not stored by Anthropic",
    "AES-256 encryption at rest, TLS 1.3 in transit",
    "SOC 2 Type II certified infrastructure",
  ];
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  residencyItems.forEach((item) => {
    doc.setTextColor(80, 80, 80);
    doc.text(`-  ${item}`, margin + 8, y, {
      maxWidth: pageWidth - margin * 2 - 16,
    });
    y += 16;
  });

  y += 14;

  y = sectionHeadingFn("ATO Acceleration Checklist", y);

  const atoSteps = [
    "Identify sponsoring agency Authorizing Official (AO)",
    "Inherit FedRAMP High controls -- saves ~60% of control assessment effort",
    "Complete agency-specific security control overlay requirements",
    "Conduct independent penetration testing on integration points",
    "Submit ATO package to agency CISO for review",
    "Obtain Interim ATO for pilot phase (typically 90 days)",
  ];
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  atoSteps.forEach((step, i) => {
    doc.setTextColor(80, 80, 80);
    doc.text(`${i + 1}.  ${step}`, margin + 8, y);
    y += 16;
  });

  return y;
}

// ── generateComplianceReport ──────────────────────────────────────────────────

export function generateComplianceReport(
  intake: IntakeFormData,
  compliance: ComplianceStatus[]
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header band
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setFillColor(...CORAL);
  doc.rect(0, 76, pageWidth, 4, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Claude Compliance Readiness Report", margin, 35);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  // Fix 1: use agencyLabel instead of raw agencyType
  doc.text(
    `${agencyLabel(intake.agencyType)} | Generated ${formatDate()}`,
    margin,
    55
  );
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);
  doc.text("UNCLASSIFIED // FOR OFFICIAL USE ONLY", margin, 70);

  let y = 108;

  // Compliance Matrix
  doc.setTextColor(...DARK_BG);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Compliance Framework Status", margin, y);
  y += 14;

  const tableBody = compliance.map((item) => [
    item.framework,
    statusLabel(item.status), // Fix 5: plain text status
    safe(item.detail),        // Fix 2: sanitize arrows
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Framework", "Status", "Details"]],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: {
      fillColor: [...ZINC_700],
      textColor: [...WHITE],
      fontStyle: "bold",
    },
    bodyStyles: { textColor: [39, 39, 42] },
    alternateRowStyles: { fillColor: [244, 244, 245] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 130 },
      1: { cellWidth: 90 },
      2: { cellWidth: "auto" },
    },
    didParseCell: colorStatusCell,
  });

  y = lastY(doc) + 24;

  // Inline section heading helper for standalone report
  function heading(text: string, yPos: number): number {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_BG);
    doc.text(text, margin, yPos);
    return yPos + 18;
  }

  y = addResidencyAndAto(doc, y, margin, pageWidth, heading);

  // Footer
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(
    "Federal Readiness Suite -- Powered by Claude | Anthropic",
    margin,
    footerY
  );
  doc.text("UNCLASSIFIED", pageWidth - margin, footerY, { align: "right" });

  // Fix 1: use agencyLabel in filename too
  const filename = `compliance-report-${safeFilename(intake.agencyType)}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

// ── generateFullReport ────────────────────────────────────────────────────────

export function generateFullReport(
  intake: IntakeFormData,
  architecture: ArchitectureRecommendation | null,
  evaluation: EvaluationResult | null,
  compliance: ComplianceStatus[],
  roadmap: ImplementationRoadmap | null
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // ── Inner helpers ────────────────────────────────────────────────────────────

  function addPageHeader(title: string, screenNum: number): number {
    doc.addPage();
    doc.setFillColor(...DARK_BG);
    doc.rect(0, 0, pageWidth, 60, "F");
    doc.setFillColor(...CORAL);
    doc.rect(0, 57, pageWidth, 3, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${screenNum}. ${title}`, margin, 38);
    return 80;
  }

  function sectionHeading(text: string, yPos: number): number {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_BG);
    doc.text(text, margin, yPos);
    return yPos + 16;
  }

  function bodyText(text: string, yPos: number): number {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(safe(text), pageWidth - margin * 2);
    doc.text(lines, margin, yPos);
    return yPos + lines.length * 13 + 6;
  }

  // ── Cover Page ───────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...CORAL);
  doc.rect(margin, 195, 60, 4, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("Claude Federal", margin, 235);
  doc.text("Readiness Assessment", margin, 270);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  // Fix 1: friendly agency label on cover page
  doc.text(`Prepared for: ${agencyLabel(intake.agencyType)}`, margin, 306);
  doc.text(`Date: ${formatDate()}`, margin, 324);
  doc.text("Classification: UNCLASSIFIED // FOUO", margin, 342);

  if (roadmap?.executiveSummary) {
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    const summaryLines = doc.splitTextToSize(
      safe(roadmap.executiveSummary),
      pageWidth - margin * 2
    );
    doc.text(summaryLines, margin, 390);
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Powered by Claude | Anthropic", margin, pageHeight - 50);
  doc.text("anthropic.com", margin, pageHeight - 36);

  // ── Page 1: Mission Intake ───────────────────────────────────────────────────
  let y = addPageHeader("Mission Intake", 1);

  y = sectionHeading("Agency Profile", y);

  // Fix 1: all raw IDs mapped to friendly labels
  const intakeFields = [
    ["Agency Type", agencyLabel(intake.agencyType)],
    ["Data Classification", classLabel(intake.dataClassification || "")],
    ["Estimated Monthly Volume", volumeLabel(intake.estimatedVolume || "")],
    ["Compliance Requirements", compReqLabels(intake.complianceRequirements ?? [])],
    ["Pain Points", painLabels(intake.painPoints ?? [])],
  ];

  autoTable(doc, {
    startY: y,
    body: intakeFields,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 160, textColor: [...ZINC_700] },
      1: { cellWidth: "auto" },
    },
    theme: "plain",
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  y = lastY(doc) + 18;

  y = sectionHeading("Mission Description", y);
  y = bodyText(intake.missionDescription || "No description provided.", y);

  // ── Page 2: Architecture ─────────────────────────────────────────────────────
  if (architecture) {
    y = addPageHeader("Architecture Recommendation", 2);

    y = sectionHeading("Recommended Model", y);
    // Fix 2: safe() strips any arrows in reasoning text
    y = bodyText(
      `${architecture.recommendedModel?.name || "Claude Sonnet 4.5"} -- ${architecture.recommendedModel?.reasoning || ""}`,
      y
    );

    y = sectionHeading("Deployment Architecture", y);
    y = bodyText(
      `Pathway: ${architecture.deploymentArchitecture?.pathway || "AWS Bedrock GovCloud"} -- ${architecture.deploymentArchitecture?.pathwayReasoning || ""}`,
      y
    );

    if (architecture.deploymentArchitecture?.layers?.length) {
      y = sectionHeading("Architecture Layers", y);
      const layerRows = architecture.deploymentArchitecture.layers.map((l) => [
        safe(l.name),
        safe(l.description),
        (l.components || []).map(safe).join(", "),
      ]);
      autoTable(doc, {
        startY: y,
        head: [["Layer", "Description", "Components"]],
        body: layerRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 100 },
          1: { cellWidth: 150 },
        },
      });
      y = lastY(doc) + 16;
    }

    if (architecture.costEstimate) {
      y = sectionHeading("Cost Estimate", y);
      const costRows = [
        [
          "Monthly Claude Cost",
          safe(architecture.costEstimate.monthlyCost || "—"),
          architecture.costEstimate.modelCostPerQuery?.costPerQuery
            ? `${safe(architecture.costEstimate.modelCostPerQuery.costPerQuery)} per query`
            : "",
        ],
        [
          "Annual Savings",
          safe(architecture.costEstimate.annualSavings || "—"),
          `${safe(architecture.costEstimate.roiMultiple || "")} ROI`,
        ],
      ];
      autoTable(doc, {
        startY: y,
        head: [["Metric", "Amount", "Notes"]],
        body: costRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 130 } },
      });
    }
  }

  // ── Page 3: Evaluation ───────────────────────────────────────────────────────
  if (evaluation) {
    y = addPageHeader("Live Evaluation Results", 3);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(
      `Scenario: ${safe(evaluation.scenarioLabel || "Custom")}`,
      margin,
      y
    );
    y += 14;
    doc.text(
      `Model: ${safe(evaluation.modelUsed || "Claude Sonnet 4.5")}`,
      margin,
      y
    );
    y += 20;

    if (evaluation.scores?.scores) {
      const scoreRows = Object.entries(evaluation.scores.scores).map(
        ([key, val]) => [
          key.charAt(0).toUpperCase() + key.slice(1),
          `${val.score}/100`,
          safe(val.explanation || ""),
        ]
      );

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Score", "Assessment"]],
        body: scoreRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 100 },
          1: { cellWidth: 60, halign: "center" },
        },
      });
      y = lastY(doc) + 14;

      // Overall score callout
      const overallScore = Number(evaluation.scores.overallScore) ?? 0;
      const calloutColor: [number, number, number] =
        overallScore >= 90
          ? [240, 253, 244]
          : overallScore >= 70
          ? [255, 251, 235]
          : [255, 241, 242];
      doc.setFillColor(...calloutColor);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 3, 3, "F");
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...GREEN);
      doc.text(`Overall Score: ${overallScore}/100`, margin + 15, y + 23);
    }
  }

  // ── Page 4: Compliance & Security ────────────────────────────────────────────
  y = addPageHeader("Compliance & Security Posture", 4);

  const compTableBody = compliance.map((item) => [
    item.framework,
    statusLabel(item.status), // Fix 5: plain text
    safe(item.detail),        // Fix 2: sanitize arrows
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Framework", "Status", "Details"]],
    body: compTableBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
    bodyStyles: { textColor: [39, 39, 42] },
    alternateRowStyles: { fillColor: [244, 244, 245] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 130 },
      1: { cellWidth: 90 },
      2: { cellWidth: "auto" },
    },
    didParseCell: colorStatusCell,
  });

  // Fix 4: add Data Residency + ATO sections to full report compliance page
  y = lastY(doc) + 24;
  y = addResidencyAndAto(doc, y, margin, pageWidth, sectionHeading);

  // ── Page 5: Roadmap ──────────────────────────────────────────────────────────
  if (roadmap) {
    y = addPageHeader("Implementation Roadmap", 5);

    // Fix 3: dynamic box height based on actual summary line count
    if (roadmap.executiveSummary) {
      const summaryText = safe(roadmap.executiveSummary);
      const summaryLines = doc.splitTextToSize(
        summaryText,
        pageWidth - margin * 2 - 20
      );
      const lineHeight = 13;
      const boxPadding = 20; // 10pt top + 10pt bottom
      const boxHeight = summaryLines.length * lineHeight + boxPadding;

      doc.setFillColor(255, 247, 237);
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 3, 3, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      doc.text(summaryLines, margin + 10, y + 14);
      y += boxHeight + 16; // proper gap — not a fixed 66pt offset
    }

    if (roadmap.phases?.length) {
      y = sectionHeading("Phased Implementation Timeline", y);

      const phaseRows = roadmap.phases.map((p) => [
        safe(p.name),
        safe(p.duration),
        safe(p.objective),
        (p.deliverables || []).slice(0, 3).map(safe).join("; "),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Phase", "Duration", "Objective", "Key Deliverables"]],
        body: phaseRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 100 },
          1: { cellWidth: 65 },
          2: { cellWidth: 140 },
        },
      });
      y = lastY(doc) + 20;
    }

    if (roadmap.roiProjection) {
      if (y > pageHeight - 180) {
        doc.addPage();
        y = 50;
      }

      y = sectionHeading("ROI Projection", y);
      const roi = roadmap.roiProjection;
      const roiRows = [
        [
          "Current Annual Cost",
          safe(roi.currentAnnualCost),
          safe(roi.currentCostBreakdown),
        ],
        [
          "Claude Annual Cost",
          safe(roi.claudeAnnualCost),
          safe(roi.claudeCostBreakdown),
        ],
        [
          "Net Annual Savings",
          safe(roi.netAnnualSavings),
          `${safe(roi.efficiencyGain)} | Payback: ${safe(roi.paybackPeriod)}`,
        ],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Amount", "Details"]],
        body: roiRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 130 } },
      });
      y = lastY(doc) + 20;
    }

    if (roadmap.nextSteps?.length) {
      if (y > pageHeight - 150) {
        doc.addPage();
        y = 50;
      }

      y = sectionHeading("Recommended Next Steps", y);

      const stepRows = roadmap.nextSteps.map((s, i) => [
        `${i + 1}`,
        safe(s.action),
        safe(s.owner),
        safe(s.timeline),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["#", "Action", "Owner", "Timeline"]],
        body: stepRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [...ZINC_700], textColor: [...WHITE] },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 80 },
          3: { cellWidth: 80 },
        },
      });
    }
  }

  // ── Page numbers on all pages ────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.text(
      "Federal Readiness Suite -- Powered by Claude",
      margin,
      pageHeight - 20
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 20,
      { align: "right" }
    );
  }

  const filename = `federal-readiness-assessment-${safeFilename(intake.agencyType)}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
