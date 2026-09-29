import { useState, type ReactNode } from "react";

type DisclosureProps = {
  id: string;
  summary: ReactNode;
  children: ReactNode;
  /** Controlled open state; omit for an uncontrolled disclosure. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Disclosure({ id, summary, children, open: controlledOpen, onOpenChange }: DisclosureProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const panelId = `disclosure-panel-${id}`;

  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure-trigger"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => {
          if (controlledOpen === undefined) setUncontrolledOpen(!open);
          onOpenChange?.(!open);
        }}
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
