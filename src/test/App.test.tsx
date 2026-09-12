import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App shell", () => {
  it("renders the hero heading", () => {
    render(<App />);
    expect(
      screen.getByText(/Embedded Systems, Linux BSP/i),
    ).toBeInTheDocument();
  });

  it("renders a skip link pointing to main", () => {
    render(<App />);
    const skip = screen.getByText("Skip to main content");
    expect(skip).toHaveAttribute("href", "#main");
  });

  it("renders a landmark header and footer", () => {
    render(<App />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows initialized status", () => {
    render(<App />);
    expect(screen.getByText("App shell initialized.")).toBeInTheDocument();
  });
});
