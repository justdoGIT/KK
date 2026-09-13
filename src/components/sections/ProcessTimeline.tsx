const steps = [
  { number: "01", label: "Observe", title: "Make the invisible measurable.", detail: "Logs, traces, scope captures, and a clear question before a fix." },
  { number: "02", label: "Shape", title: "Turn signal into architecture.", detail: "A map of boundaries that lets hardware, firmware, and people move together." },
  { number: "03", label: "Ship", title: "Leave behind a system that teaches.", detail: "Repeatable verification, recovery paths, and evidence your team can use." },
];

export function ProcessTimeline() {
  return (
    <section className="process-section" id="approach" aria-label="Working approach">
      <div className="section-header process-header">
        <p className="section-kicker">The working method</p>
        <h2>A calm process for complicated systems.</h2>
      </div>
      <div className="process-track">
        {steps.map((step) => (
          <article className="process-step" key={step.number}>
            <div className="process-step-number">{step.number}</div>
            <p className="process-step-label">{step.label}</p>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
