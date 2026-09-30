import { useRef, type JSX } from "react";
import { useGridScrollReveal } from "../../motion/grid-scroll-reveal.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
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

// Cards swing open from their left edge like pages turning, rising into place.
function processTransform(inv: number): string {
  return (
    `perspective(1200px) translate3d(0, ${(inv * 70).toFixed(1)}px, 0) ` +
    `rotateY(${(-inv * 32).toFixed(2)}deg) rotateX(${(inv * 10).toFixed(2)}deg) ` +
    `scale(${(0.88 + 0.12 * (1 - inv)).toFixed(3)})`
  );
}

export function ProcessTimeline(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const traceRef = useRef<HTMLSpanElement>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGridScrollReveal(trackRef, cardRefs, processTransform, enhanced, (_opened, mean) => {
    if (traceRef.current) {
      traceRef.current.style.transform = `scaleX(${mean.toFixed(4)})`;
    }
    cardRefs.current.forEach((card, i) => {
      nodeRefs.current[i]?.classList.toggle("is-lit", !!card?.classList.contains("is-open"));
    });
  }, 0.2);

  return (
    <section
      className="process-section"
      id="approach"
      aria-label="Working approach"
      data-scroll-slow="0.6"
    >
      <div className="section-header process-header">
        <LusionKineticHeading
          kicker="Engineering Invariants"
          text="A Proven Method for High-Stakes Systems"
          variant="cascade"
          subtitle="How we take high-complexity hardware projects from initial prototype uncertainty to dependable, enterprise-scale production reality."
        />
      </div>

      {/* Circuit trace: fills with scroll; each node lights as its step opens */}
      <div className="process-circuit" aria-hidden="true">
        <span ref={traceRef} className="process-circuit-fill" />
        {steps.map((step, idx) => (
          <span
            key={step.number}
            ref={(el) => {
              nodeRefs.current[idx] = el;
            }}
            className="process-circuit-node"
            style={{ left: `${(idx + 0.5) * (100 / steps.length)}%` }}
          />
        ))}
      </div>

      <div
        ref={trackRef}
        className={`process-track ${enhanced ? "is-scroll-reveal" : ""}`}
      >
        {steps.map((step, idx) => (
          <article
            key={step.number}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            className="process-step-card"
          >
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
