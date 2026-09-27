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
  mermaidDiagram: string;
  protocols: string[];
  dataFlowDescription: string;
  results: { label: string; value: string; source: string }[];
  limitations: string[];
};

export type DiagramNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  protocol?: string;
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
      { id: "soc", label: "QCM2290 SoC", x: 25, y: 35, protocol: "AXI Bus" },
      { id: "boot", label: "U-Boot / Kernel", x: 50, y: 35, protocol: "Secure Boot", connectsTo: ["soc"] },
      { id: "ota", label: "OSTree A/B OTA", x: 75, y: 35, protocol: "eMMC 5.1", connectsTo: ["boot"] },
      { id: "watchdog", label: "PMIC Watchdog", x: 50, y: 75, protocol: "I2C Reset", connectsTo: ["boot"] },
    ],
    mermaidDiagram: `graph LR
    subgraph SiliconLayer[Hardware & Power Subsystem]
      PMIC[Qualcomm PMIC & Hardware Watchdog] -->|I2C / Power Reset| QCM2290[Qualcomm QCM2290 Industrial SoC]
      Sensor[Industrial Sensors / RS485] -->|UART / SPI / I2C| QCM2290
    end

    subgraph BootloaderBSP[Boot & BSP Layer]
      QCM2290 -->|XBL -> ABL| UBoot[Hardened U-Boot Bootloader]
      UBoot -->|Signed Device Tree| Kernel[Linux Kernel 5.15 LTS + Custom Drivers]
    end

    subgraph UserSpaceOTA[Production User Space]
      Kernel -->|Systemd / OSTree| RootfsA[Rootfs Slot A (Active)]
      Kernel -.->|Dual-Partition Fallback| RootfsB[Rootfs Slot B (Pending)]
      OSTree[OSTree Atomic OTA Daemon] -->|Signed Payload| RootfsB
    end`,
    protocols: ["AXI Bus", "Secure Boot", "I2C Fast+", "eMMC 5.1", "UART", "RS-485"],
    dataFlowDescription:
      "Sensors stream over UART/RS-485 into the QCM2290 SoC. The PMIC maintains hardware watchdog heartbeats. On OTA triggers, OSTree deploys an atomic rootfs diff to the standby partition slot, verifying signatures before switching boot targets.",
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
      { id: "agent", label: "Fleet Agent Node", x: 20, y: 35, protocol: "RPC / Heartbeat" },
      { id: "api", label: "Actix API Server", x: 48, y: 35, protocol: "REST / WebSockets", connectsTo: ["agent"] },
      { id: "dash", label: "React Dashboard", x: 80, y: 35, protocol: "HTTPS / WSS", connectsTo: ["api"] },
      { id: "telemetry", label: "Stratum-TSDB", x: 48, y: 75, protocol: "Zero-Copy IPC", connectsTo: ["api"] },
    ],
    mermaidDiagram: `graph TD
    subgraph FleetNodes[Fleet Edge Compute Nodes]
      Worker1[Headless Worker: MSI Controller]
      Worker2[Worker: Qualcomm Edge Node]
      Worker3[Worker: Xilinx ZynqMP Node]
    end

    subgraph CoreRuntime[Distributed Control Plane]
      Worker1 & Worker2 & Worker3 -->|Heartbeat / Signed Auth| FleetAgent[Fleet Agent Daemon]
      FleetAgent -->|Typed RPC Protocol| APIServer[Rust Actix-Web Management API]
    end

    subgraph StorageObservability[Observability & UI Layer]
      APIServer -->|mmap Zero-Copy Ingest| StratumTSDB[Stratum-TSDB Time-Series Engine]
      APIServer -->|WebSockets Telemetry| ReactDash[Real-Time Fleet Dashboard]
    end`,
    protocols: ["Typed RPC", "Zero-Copy mmap", "WebSockets", "TLS Auth", "Slurm RPC"],
    dataFlowDescription:
      "Distributed fleet workers ingest compiler telemetry and hardware health status via signed RPC heartbeats into the Actix API server. High-frequency sensor samples stream to Stratum-TSDB via zero-copy memory maps while the React dashboard updates in real time.",
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
      { id: "tui", label: "Rio/Terminal TUI", x: 20, y: 35, protocol: "ANSI / PTY" },
      { id: "core", label: "Canonical Task AST", x: 50, y: 35, protocol: "State Machine", connectsTo: ["tui"] },
      { id: "acp", label: "ACP Client Protocol", x: 80, y: 35, protocol: "JSON-RPC", connectsTo: ["core"] },
      { id: "tools", label: "Diagnostic Engine", x: 50, y: 75, protocol: "LSP / AST Edit", connectsTo: ["core"] },
    ],
    mermaidDiagram: `graph TD
    subgraph Frontends[User & Agent Interfaces]
      TUI[Rio Terminal TUI Interface] -->|PTY Input| Engine[Agent Harness Engine Core]
      ACP[Agent Client Protocol / JSON-RPC] -->|Remote Directives| Engine
    end

    subgraph StateAndTools[Canonical Task Engine]
      Engine -->|Immutable State Transitions| TaskAST[Canonical Task AST State Machine]
      Engine -->|LSP / CodeMod / AST Edit| ToolSuite[Tool Orchestration Layer]
    end

    subgraph ClusterVerification[Verification & Execution]
      ToolSuite -->|Subprocess RPC| Sandbox[Sandboxed Execution Subprocess]
      ToolSuite -->|Telemetry Evidence| Journal[Execution Log & Artifact Journal]
    end`,
    protocols: ["Agent Client Protocol", "JSON-RPC 2.0", "LSP Protocol", "PTY / ANSI", "Task AST"],
    dataFlowDescription:
      "User directives flow from the Rio Terminal TUI or remote ACP client into the Agent Harness Engine. State is tracked deterministically in a Canonical Task AST, which orchestrates language server diagnostics, compiler checks, and sandboxed execution runs.",
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
      { id: "discover", label: "Job Discovery", x: 18, y: 35, protocol: "ATS REST API" },
      { id: "match", label: "Profile Matcher", x: 42, y: 35, protocol: "Semantic Vector", connectsTo: ["discover"] },
      { id: "tailor", label: "LLM Resume Tailor", x: 68, y: 35, protocol: "LLM Prompting", connectsTo: ["match"] },
      { id: "apply", label: "Guarded Submitter", x: 90, y: 35, protocol: "Dry-Run Gate", connectsTo: ["tailor"] },
      { id: "db", label: "SQLite State DB", x: 50, y: 75, protocol: "SQL Storage", connectsTo: ["match"] },
    ],
    mermaidDiagram: `graph LR
    subgraph Ingestion[Job Ingestion & Parsing]
      ATS[Greenhouse / Lever / ATS APIs] -->|REST Ingestion| Scraper[Job Discovery Scraper]
      Scraper -->|Normalize Schema| SQLiteDB[(SQLite Pipeline State DB)]
    end

    subgraph Intelligence[Matching & Tailoring]
      SQLiteDB -->|Job Spec Data| Matcher[Semantic Profile Matcher]
      Matcher -->|Top-K Fit| LLMTailor[LLM Resume & Cover Letter Tailor]
    end

    subgraph GuardedAction[Guarded Submission Pipeline]
      LLMTailor -->|Generated PDF / Metadata| DryRunGate{Dry-Run Safety Gate}
      DryRunGate -->|Operator Confirm| Submitter[Guarded Application Submitter]
      DryRunGate -.->|Default Safe Mode| LogOnly[Audit Log Record Only]
    end`,
    protocols: ["REST / ATS APIs", "Semantic Vector Scoring", "SQLite ACID", "Dry-Run Safety Gate"],
    dataFlowDescription:
      "Job opportunities from major ATS platforms are ingested into SQLite. Profile matching ranks target roles, passing context to the LLM tailoring engine. Generated applications require human clearance at the Dry-Run Safety Gate prior to transmission.",
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
