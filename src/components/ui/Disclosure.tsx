import { useState, type ReactNode } from "react";

type DisclosureProps = {
  id: string;
  summary: ReactNode;
  children: ReactNode;
};

export function Disclosure({ id, summary, children }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  const panelId = `disclosure-panel-${id}`;

  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure-trigger"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="disclosure-summary">{summary}</span>
        <span className="disclosure-icon" aria-hidden="true">
          {open ? "\u2212" : "+"}
        </span>
      </button>
      {open && (
        <div id={panelId} className="disclosure-panel">
          {children}
        </div>
      )}
    </div>
  );
}
