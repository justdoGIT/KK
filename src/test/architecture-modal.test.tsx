import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchitectureModal, type ArchitectureDetail } from "../components/ui/ArchitectureModal.tsx";

const architecture: ArchitectureDetail = {
  title: "Board boot flow",
  number: "01",
  context: "Boot sequence",
  mermaidCode: "graph LR; Boot-->Kernel",
  nodes: [{ id: "boot", label: "Boot", x: 50, y: 50 }],
  protocols: ["SPI"],
  dataFlowDescription: "Boot loads the kernel.",
};
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Inspect board</button>
    <ArchitectureModal isOpen={open} onClose={() => setOpen(false)} architecture={architecture} />
  </>;
}

afterEach(() => {
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  if (execDescriptor) Object.defineProperty(document, "execCommand", execDescriptor);
  else Reflect.deleteProperty(document, "execCommand");
});

describe("architecture dialog", () => {
  it("contains backward focus from the initial container and restores the trigger", () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole("button", { name: "Inspect board" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    const controls = dialog.querySelectorAll<HTMLElement | SVGElement>('button, [tabindex="0"]');
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(controls[controls.length - 1]);
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(controls[0]);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("keeps current focus when the parent recreates its close callback", () => {
    const view = render(<ArchitectureModal isOpen onClose={() => undefined} architecture={architecture} />);
    const close = screen.getByRole("button", { name: "Close architecture modal" });
    close.focus();
    view.rerender(<ArchitectureModal isOpen onClose={() => undefined} architecture={architecture} />);
    expect(close).toHaveFocus();
  });

  it("restores the previous body overflow after closing", () => {
    document.body.style.overflow = "clip";
    const view = render(<ArchitectureModal isOpen onClose={() => undefined} architecture={architecture} />);
    expect(document.body.style.overflow).toBe("hidden");
    view.unmount();
    expect(document.body.style.overflow).toBe("clip");
    document.body.style.overflow = "";
  });

  it("reports a denied copy instead of claiming success", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
    render(<DialogHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect board" }));
    fireEvent.click(screen.getByRole("button", { name: "Mermaid Code" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy Mermaid Code" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Copy unavailable" })).toBeVisible());
    expect(screen.queryByText(/Copied to Clipboard/)).toBeNull();
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("reports fallback success after async clipboard denial and retains focus", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => true });
    render(<DialogHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect board" }));
    fireEvent.click(screen.getByRole("button", { name: "Mermaid Code" }));
    const copy = screen.getByRole("button", { name: "Copy Mermaid Code" });
    copy.focus();
    fireEvent.click(copy);
    await waitFor(() => expect(screen.getByRole("button", { name: /Copied to Clipboard/ })).toBeVisible());
    expect(copy).toHaveFocus();
    expect(document.querySelector("textarea")).toBeNull();
  });
});
