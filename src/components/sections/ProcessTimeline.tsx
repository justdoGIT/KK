import { type JSX } from "react";

type ProcessStep = {
  number: string;
  badge: string;
  label: string;
  title: string;
  detail: string;
  clientBenefit: string;
};

const steps: ProcessStep[] = [
  {
    number: "01",
    badge: "EVIDENCE-FIRST",
    label: "Diagnose & Isolate",
    title: "Make the physical signals visible and measurable.",
    detail:
      "Before applying code changes, we capture hardware ground truth: PMIC voltage step-responses on digital oscilloscopes, JTAG register dumps, logic analyzer bus traces, and ftrace kernel timing. No guesswork.",
    clientBenefit: "Guarantees that hardware anomalies are isolated from software bugs immediately.",
  },
  {
    number: "02",
    badge: "DETERMINISTIC",
    label: "Architect & Harden",
    title: "Transform silicon into an unbricking, secure system.",
    detail:
      "We author custom Yocto BSP layers, configure real-time RTOS tasks, establish Hardware Root-of-Trust (HSM) key signing, and architect atomic OSTree dual-slot OTA pipelines with hardware watchdog fallback.",
    clientBenefit: "Protects products against field bricking, security vulnerabilities, and kernel panics.",
  },
  {
    number: "03",
    badge: "AUTOMATED",
    label: "Automate & Verify",
    title: "Build repeatable Hardware-in-the-Loop test rigs.",
    detail:
      "Automated test fixtures power-cycle boards, simulate power glitches, stress peripheral buses under max throughput, and record serial UART telemetry evidence into automated CI/CD regression runs.",
    clientBenefit: "Ensures every firmware and kernel update is verified against physical hardware before deployment.",
  },
  {
    number: "04",
    badge: "ZERO VENDOR LOCK-IN",
    label: "Deploy & Empower",
    title: "Deliver clean, documented code and empower your team.",
    detail:
      "Full ownership of all artifacts: clean Yocto meta-layers, well-commented C/C++/Rust code, flashing scripts, and comprehensive architecture runbooks. We conduct walkthroughs so your in-house engineers take over with confidence.",
    clientBenefit: "Complete IP ownership with zero external dependencies or proprietary runtime licensing.",
  },
];

export function ProcessTimeline(): JSX.Element {
  return (
    <section
      className="process-section"
      id="approach"
      aria-label="Working approach"
    >
      <div className="section-header process-header">
        <p className="section-kicker">Engineering Invariants</p>
        <h2>A Proven Method for High-Stakes Systems</h2>
        <p className="section-subtitle">
          How we take high-complexity hardware projects from initial prototype uncertainty
          to dependable, enterprise-scale production reality.
        </p>
      </div>

      <div className="process-track">
        {steps.map((step) => (
          <article className="process-step-card" key={step.number}>
            <div className="process-step-topline">
              <span className="process-step-number">{step.number}</span>
              <span className="process-step-badge">{step.badge}</span>
            </div>

            <p className="process-step-label">{step.label}</p>
            <h3>{step.title}</h3>
            <p className="process-step-detail">{step.detail}</p>

            <div className="process-benefit-box">
              <span className="benefit-tag">CLIENT IMPACT:</span>
              <p className="benefit-desc">{step.clientBenefit}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
