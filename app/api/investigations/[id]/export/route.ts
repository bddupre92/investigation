import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(",")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      problemDefinition: true,
      riskAssessment: true,
      toolDecision: true,
      problemCategory: true,
      fiveWhys: { orderBy: [{ treeIndex: "asc" }, { depth: "asc" }] },
      fishboneCauses: { orderBy: { category: "asc" } },
      isIsNotEntries: true,
      processAnalysisSteps: { orderBy: { stepNumber: "asc" } },
      rootCause: true,
      capaActions: {
        include: { owner: true },
        orderBy: { createdAt: "asc" },
      },
      effectivenessRecord: true,
      createdBy: true,
    },
  })

  if (!investigation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const {
    problemDefinition: pd,
    riskAssessment: ra,
    toolDecision: td,
    problemCategory: pc,
    fiveWhys,
    fishboneCauses,
    isIsNotEntries,
    processAnalysisSteps,
    rootCause: rc,
    capaActions,
    effectivenessRecord: er,
  } = investigation

  const lines: string[] = []

  // Header
  lines.push("INVESTIGATION REPORT")
  lines.push("")
  lines.push(csvRow(["Reference Number", investigation.referenceNumber]))
  lines.push(csvRow(["Title", investigation.title]))
  lines.push(csvRow(["Status", investigation.status]))
  lines.push(csvRow(["Created By", investigation.createdBy.name]))
  lines.push(csvRow(["Created At", investigation.createdAt.toISOString()]))
  if (investigation.closedAt) {
    lines.push(csvRow(["Closed At", investigation.closedAt.toISOString()]))
  }

  // Problem Definition
  lines.push("")
  lines.push("PROBLEM DEFINITION")
  if (pd) {
    lines.push(csvRow(["Description", pd.description]))
    lines.push(csvRow(["Department", pd.department]))
    lines.push(csvRow(["Occurred At", pd.occurredAt.toISOString()]))
    lines.push(csvRow(["Detection Method", pd.detectionMethod]))
    lines.push(csvRow(["Detection Detail", pd.detectionDetail]))
    lines.push(csvRow(["Containment Actions", pd.containmentActions]))
    lines.push(csvRow(["Product Affected", pd.productAffected ? "Yes" : "No"]))
    lines.push(csvRow(["Product Details", pd.productDetails]))
  } else {
    lines.push("Not completed")
  }

  // Risk Assessment
  lines.push("")
  lines.push("RISK ASSESSMENT")
  if (ra) {
    lines.push(csvRow(["Risk Level", ra.riskLevel]))
    lines.push(csvRow(["Total Score", ra.totalScore]))
    lines.push(csvRow(["Q1 Score", ra.q1Score]))
    lines.push(csvRow(["Q2 Score", ra.q2Score]))
    lines.push(csvRow(["Q3 Score", ra.q3Score]))
    lines.push(csvRow(["Q4 Score", ra.q4Score]))
    lines.push(csvRow(["Q5 Score", ra.q5Score]))
  } else {
    lines.push("Not completed")
  }

  // Tool Decision
  lines.push("")
  lines.push("TOOL SELECTION")
  if (td) {
    lines.push(csvRow(["Five Whys", td.fiveWhys ? "Selected" : "Not Selected"]))
    lines.push(csvRow(["Fishbone / Ishikawa", td.fishbone ? "Selected" : "Not Selected"]))
    lines.push(csvRow(["Is / Is Not", td.isIsNot ? "Selected" : "Not Selected"]))
    lines.push(csvRow(["Process Analysis", td.processAnalysis ? "Selected" : "Not Selected"]))
    if (td.notes) lines.push(csvRow(["Notes", td.notes]))
  } else {
    lines.push("Not completed")
  }

  // Problem Category
  lines.push("")
  lines.push("PROBLEM CATEGORY")
  if (pc) {
    lines.push(csvRow(["Category", pc.category]))
    lines.push(csvRow(["Justification", pc.justification]))
  } else {
    lines.push("Not completed")
  }

  // Five Whys
  lines.push("")
  lines.push("FIVE WHYS ANALYSIS")
  if (fiveWhys.length > 0) {
    lines.push(csvRow(["Tree", "Depth", "Question", "Answer", "Evidence"]))
    for (const w of fiveWhys) {
      lines.push(csvRow([w.treeIndex + 1, w.depth, w.whyQuestion, w.answer, w.evidence]))
    }
  } else {
    lines.push("Not completed")
  }

  // Fishbone
  if (fishboneCauses.length > 0) {
    lines.push("")
    lines.push("FISHBONE / ISHIKAWA ANALYSIS")
    lines.push(csvRow(["Category", "Cause", "Evidence"]))
    for (const c of fishboneCauses) {
      lines.push(csvRow([c.category, c.cause, c.evidence]))
    }
  }

  // Is / Is Not
  if (isIsNotEntries.length > 0) {
    lines.push("")
    lines.push("IS / IS NOT ANALYSIS")
    lines.push(csvRow(["Dimension", "IS", "IS NOT", "Distinction"]))
    for (const e of isIsNotEntries) {
      lines.push(csvRow([e.dimension, e.isDescription, e.isNotDescription, e.distinction]))
    }
  }

  // Process Analysis
  if (processAnalysisSteps.length > 0) {
    lines.push("")
    lines.push("PROCESS ANALYSIS")
    lines.push(csvRow(["Step #", "Process Step", "Expected", "Actual", "Deviation", "Deviation Detail"]))
    for (const s of processAnalysisSteps) {
      lines.push(csvRow([s.stepNumber, s.processStep, s.expected, s.actual, s.deviation ? "Yes" : "No", s.deviationDetail]))
    }
  }

  // Root Cause
  lines.push("")
  lines.push("ROOT CAUSE CONFIRMATION")
  if (rc) {
    lines.push(csvRow(["Root Cause Statement", rc.rootCauseStatement]))
    lines.push(csvRow(["Supported by Evidence", rc.validationQ1 ? "Yes" : "No"]))
    lines.push(csvRow(["Sufficient Data Reviewed", rc.validationQ2 ? "Yes" : "No"]))
    lines.push(csvRow(["Prevents Recurrence", rc.validationQ3 ? "Yes" : "No"]))
  } else {
    lines.push("Not completed")
  }

  // CAPA
  lines.push("")
  lines.push("CAPA ACTIONS")
  if (capaActions.length > 0) {
    lines.push(csvRow(["Type", "Description", "Owner", "Due Date", "Priority", "Status", "Success Metric"]))
    for (const a of capaActions) {
      lines.push(csvRow([a.type, a.description, a.owner.name, a.dueDate.toISOString(), a.priority, a.status, a.successMetric]))
    }
  } else {
    lines.push("No CAPA actions defined")
  }

  // Effectiveness
  lines.push("")
  lines.push("EFFECTIVENESS VERIFICATION")
  if (er) {
    lines.push(csvRow(["Monitoring Period (days)", er.monitoringPeriodDays]))
    lines.push(csvRow(["Verification Method", er.verificationMethod]))
    lines.push(csvRow(["Success Criteria", er.successCriteria]))
    lines.push(csvRow(["Result", er.result]))
    lines.push(csvRow(["Result Detail", er.resultDetail]))
    lines.push(csvRow(["Reviewer", er.reviewerName]))
    lines.push(csvRow(["Reviewer Approved", er.reviewerApproved ? "Yes" : "Pending"]))
  } else {
    lines.push("Not completed")
  }

  const csv = lines.join("\r\n")
  const filename = `${investigation.referenceNumber}-report.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
