import type { PublicationRecord } from "./schema.ts";
import industrialEdge from "../../publication-records/industrial-edge.json";
import fleetRuntime from "../../publication-records/fleet-runtime.json";
import personalHarness from "../../publication-records/personal-agent-harness.json";
import careerAutomation from "../../publication-records/career-automation.json";

export type CaseStudyDetail = {
  record: PublicationRecord;
  context: string;
  constraints: string[];
  solution: string;
  diagram: DiagramNode[];
  results: { label: string; value: string; source: string }[];
  limitations: string[];
};

export type DiagramNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  connectsTo?: string[];
};

const allRecords: PublicationRecord[] = [
  industrialEdge as PublicationRecord,
  fleetRuntime as PublicationRecord,
  personalHarness as PublicationRecord,
  careerAutomation as PublicationRecord,
];

const details: Record<string, Omit<CaseStudyDetail, "record">> = {
  "industrial-edge": {
    context:
      "Board bring-up and BSP development for Qualcomm QCM2290 industrial edge devices requiring reliable field deployment.",
    constraints: [
      "Watchdog and power-aware state management required",
      "Atomic OTA updates for minimal downtime",
      "Low-level debugging across multiple board variants",
    ],
    solution:
      "Implemented board bring-up with watchdog timers, power state management, and OSTree-based atomic updates. Used JTAG, UART, ftrace, and oscilloscopes for diagnosis.",
    diagram: [
      { id: "soc", label: "QCM2290 SoC", x: 50, y: 30 },
      { id: "boot", label: "U-Boot / Kernel", x: 50, y: 55, connectsTo: ["soc"] },
      { id: "ota", label: "OSTree OTA", x: 25, y: 80, connectsTo: ["boot"] },
      { id: "watchdog", label: "Watchdog", x: 75, y: 80, connectsTo: ["boot"] },
    ],
    results: [
      {
        label: "Uptime",
        value: "99.9%",
        source: "resume-reported",
      },
      {
        label: "Update method",
        value: "Atomic (OSTree)",
        source: "resume-reported",
      },
    ],
    limitations: [
      "Uptime figure is resume-reported, not independently measured",
      "Specific deployment details are excluded",
    ],
  },
  "fleet-runtime": {
    context:
      "Distributed fleet runtime for autonomous dev-machine management with agent, API, and dashboard components.",
    constraints: [
      "Typed worker protocol for reliable agent communication",
      "Telemetry and evidence collection for observability",
      "Clear separation of implemented vs planned features",
    ],
    solution:
      "Built agent binary for health collection, heartbeat, manifest sync, and auth. API server with actix-web for machine management. React dashboard for monitoring. Planned extension into distributed model serving is documented as planned, not shipped.",
    diagram: [
      { id: "agent", label: "Fleet Agent", x: 25, y: 30 },
      { id: "api", label: "API Server", x: 50, y: 30, connectsTo: ["agent"] },
      { id: "dash", label: "Dashboard", x: 75, y: 30, connectsTo: ["api"] },
      { id: "telemetry", label: "Telemetry", x: 50, y: 60, connectsTo: ["api"] },
    ],
    results: [
      {
        label: "Components",
        value: "Agent + API + Dashboard",
        source: "not-a-metric",
      },
      {
        label: "Protocol",
        value: "Typed worker",
        source: "not-a-metric",
      },
    ],
    limitations: [
      "Distributed model serving is planned, not shipped",
      "Client and topology details are excluded",
    ],
  },
  "personal-agent-harness": {
    context:
      "Terminal-based AI coding agent with TUI, headless mode, and Agent Client Protocol support for structured task management.",
    constraints: [
      "Canonical task AST for reliable task state",
      "Rollout controls for gradual feature release",
      "Observability and recovery for reliable operation",
    ],
    solution:
      "Implemented TUI and headless lifecycle with a canonical task AST for structured task management. Added rollout controls, observability, benchmarks, and recovery for production reliability.",
    diagram: [
      { id: "tui", label: "TUI", x: 25, y: 30 },
      { id: "core", label: "Task AST", x: 50, y: 30, connectsTo: ["tui"] },
      { id: "headless", label: "Headless", x: 25, y: 55, connectsTo: ["core"] },
      { id: "acp", label: "ACP", x: 75, y: 30, connectsTo: ["core"] },
      { id: "obs", label: "Observability", x: 50, y: 60, connectsTo: ["core"] },
    ],
    results: [
      {
        label: "Modes",
        value: "TUI + Headless + ACP",
        source: "not-a-metric",
      },
      {
        label: "Recovery",
        value: "Rollout controls",
        source: "not-a-metric",
      },
    ],
    limitations: [
      "No source link is rendered (claim-only publication)",
      "No ownership or availability claims are made",
    ],
  },
  "career-automation": {
    context:
      "Automated job discovery, resume tailoring, and guarded application submission as a local daemon and CLI tool.",
    constraints: [
      "Dry-run gate enabled by default for application submission",
      "SQLite database for pipeline state",
      "Three integration paths: plugin, CLI, MCP server",
    ],
    solution:
      "Built discovery across ATSes and job boards, matching against profiles, resume + cover letter tailoring via LLM, and submission with a hard dry-run gate. Ships as Claude Code plugin, CLI/daemon, and MCP server.",
    diagram: [
      { id: "discover", label: "Discover", x: 20, y: 30 },
      { id: "match", label: "Match", x: 40, y: 30, connectsTo: ["discover"] },
      { id: "tailor", label: "Tailor", x: 60, y: 30, connectsTo: ["match"] },
      { id: "apply", label: "Apply (dry-run)", x: 80, y: 30, connectsTo: ["tailor"] },
      { id: "db", label: "SQLite", x: 50, y: 60, connectsTo: ["match"] },
    ],
    results: [
      {
        label: "Sources",
        value: "Greenhouse, Lever, Naukri, MCP",
        source: "not-a-metric",
      },
      {
        label: "Gate",
        value: "Dry-run by default",
        source: "not-a-metric",
      },
    ],
    limitations: [
      "Local remote identity differs from canonical URL",
      "Private configuration details are excluded",
    ],
  },
};

export function getApprovedCaseStudies(): CaseStudyDetail[] {
  const approved: CaseStudyDetail[] = [];
  for (const record of allRecords) {
    if (
      record.publicationApproval.status === "approved" &&
      record.redactionReview.status === "passed"
    ) {
      const detail = details[record.slug];
      if (detail) {
        approved.push({ record, ...detail });
      }
    }
  }
  return approved;
}
