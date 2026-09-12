import { services } from "../../content/services.ts";

export function Services() {
  return (
    <section
      aria-label="Services"
      className="services-section"
      id="services"
    >
      <div className="section-header">
        <h2>Services</h2>
        <p className="section-subtitle">
          Embedded systems consultancy across the full stack — from silicon to
          deployment.
        </p>
      </div>
      <div className="services-grid">
        {services.map((service) => (
          <article key={service.id} className="service-card">
            <h3>{service.title}</h3>
            <p className="service-desc">{service.description}</p>
            <ul className="service-capabilities">
              {service.capabilities.map((cap) => (
                <li key={cap}>{cap}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
