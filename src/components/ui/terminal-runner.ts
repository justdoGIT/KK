import type { TerminalCommand } from "../../content/terminal.ts";

// Scroll-progress script used by the interactive terminal. Kept as a pure
// projection of scroll progress so the typed command and the revealed output
// lines can be tested without a DOM or a scheduler.
export const REVEAL_FRACTION = 0.2;
/** Share of a command's step spent typing before its output starts. */
export const TYPE_FRACTION = 0.35;

export type TerminalState = {
  /** Command the script is on; carried over while the script is left of start. */
  cmdIndex: number;
  /** Characters of the command typed so far, or null when the line is cleared. */
  typedChars: number | null;
  /** Output lines revealed so far. */
  lines: number;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Script state at scroll `raw` (0..1), continuing from `prev`'s command. */
export function terminalState(
  raw: number,
  prev: TerminalState,
  commands: readonly TerminalCommand[],
): TerminalState {
  // Slightly before the reveal settles the line is still cleared, matching the
  // reveal animation's own start so text never pops in under a scaled card.
  if (raw < REVEAL_FRACTION * 0.9) return { cmdIndex: prev.cmdIndex, typedChars: null, lines: 0 };
  const script = clamp01((clamp01(raw) - REVEAL_FRACTION) / (1 - REVEAL_FRACTION));
  const step = 1 / commands.length;
  const cmdIndex = Math.min(commands.length - 1, Math.floor(script / step));
  const cmd = commands[cmdIndex];
  const local = (script - cmdIndex * step) / step;
  if (local < TYPE_FRACTION) {
    return {
      cmdIndex,
      typedChars: Math.max(1, Math.floor((local / TYPE_FRACTION) * cmd.command.length)),
      lines: 0,
    };
  }
  const revealed = (local - TYPE_FRACTION) / (1 - TYPE_FRACTION);
  return {
    cmdIndex,
    typedChars: cmd.command.length,
    lines: Math.min(cmd.output.length, Math.max(1, Math.ceil(revealed * cmd.output.length))),
  };
}
