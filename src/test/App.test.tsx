import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App shell", () => {
  it("renders the hero heading", () => {
    render(<App />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/Embedded Systems, Linux BSP/i);
  });

  it("renders a skip link pointing to main", () => {
    render(<App />);
    const skip = screen.getByText("Skip to main content");
    expect(skip).toHaveAttribute("href", "#main");
  });

  it("renders landmark header and footer", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders all main sections", () => {
    render(<App />);
    expect(screen.getByLabelText("Hero")).toBeInTheDocument();
    expect(screen.getByLabelText("Services")).toBeInTheDocument();
    expect(screen.getByLabelText("Case studies")).toBeInTheDocument();
    expect(screen.getByLabelText("Career timeline")).toBeInTheDocument();
    expect(screen.getByLabelText("Skill matrix")).toBeInTheDocument();
    expect(screen.getByLabelText("Contact")).toBeInTheDocument();
  });

  it("renders exactly one h1", () => {
    const { container } = render(<App />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
  });

  it("renders service cards with capabilities", () => {
    render(<App />);
    expect(screen.getByText("Firmware & Board Bring-Up")).toBeInTheDocument();
    expect(
      screen.getByText("Embedded Linux & BSP Development"),
    ).toBeInTheDocument();
  });

  it("renders career timeline entries", () => {
    render(<App />);
    expect(screen.getByText("SYMX.AI")).toBeInTheDocument();
    expect(screen.getByText("Vestel International")).toBeInTheDocument();
  });
});
