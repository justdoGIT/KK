import { describe, expect, it } from "vitest";
import { REVEAL_FRACTION, terminalState, type TerminalState } from "../components/ui/terminal-runner.ts";
import type { TerminalCommand } from "../content/terminal.ts";

const CLEARED: TerminalState = { cmdIndex: 0, typedChars: null, lines: 0 };

const commands: TerminalCommand[] = [
  { id: "a", tabTitle: "a.sh", command: "command-a", description: "", output: ["a1", "a2", "a3", "a4"], exitCode: 0 },
  { id: "b", tabTitle: "b.sh", command: "command-b", description: "", output: ["b1", "b2"], exitCode: 0 },
];

describe("terminal scroll script", () => {
  it("keeps the line cleared before the reveal settles", () => {
    expect(terminalState(0, { cmdIndex: 1, typedChars: 5, lines: 2 }, commands))
      .toEqual({ cmdIndex: 1, typedChars: null, lines: 0 });
    expect(terminalState(REVEAL_FRACTION * 0.85, CLEARED, commands).typedChars).toBeNull();
  });

  it("starts the first command typing from the reveal boundary", () => {
    const justPast = terminalState(REVEAL_FRACTION * 0.9, CLEARED, commands);
    expect(justPast.cmdIndex).toBe(0);
    expect(justPast.typedChars).toBe(1);
    expect(justPast.lines).toBe(0);
  });

  it("types before revealing output, then holds the full command", () => {
    const mid = terminalState(REVEAL_FRACTION + (1 - REVEAL_FRACTION) * 0.1, CLEARED, commands);
    expect(mid.cmdIndex).toBe(0);
    expect(mid.typedChars).toBeGreaterThan(0);
    expect(mid.typedChars).toBeLessThan(commands[0].command.length);
    expect(mid.lines).toBe(0);

    const half = terminalState(REVEAL_FRACTION + (1 - REVEAL_FRACTION) * 0.25, CLEARED, commands);
    expect(half.typedChars).toBe(commands[0].command.length);
    expect(half.lines).toBeGreaterThan(0);
    expect(half.lines).toBeLessThan(commands[0].output.length);
  });

  it("advances to the later command and clamps at the end of the section", () => {
    const second = terminalState(REVEAL_FRACTION + (1 - REVEAL_FRACTION) * 0.7, CLEARED, commands);
    expect(second.cmdIndex).toBe(1);
    expect(second.typedChars).toBe(commands[1].command.length);
    const end = terminalState(1, CLEARED, commands);
    expect(end.cmdIndex).toBe(1);
    expect(end.lines).toBe(commands[1].output.length);
  });

  it("never exceeds the outputs of the command it is on", () => {
    let state = CLEARED;
    for (let raw = 0; raw <= 1.0001; raw += 0.01) {
      state = terminalState(raw, state, commands);
      const cmd = commands[state.cmdIndex];
      expect(state.typedChars === null || state.typedChars <= cmd.command.length).toBe(true);
      expect(state.lines).toBeLessThanOrEqual(cmd.output.length);
    }
  });
});
