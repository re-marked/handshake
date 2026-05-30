import type { Strength } from "@/switchboard";

/**
 * Tie warmth as one hue — our rose — vivid (close) fading to dusty mauve-grey (dormant).
 * Strength reads from intensity, not a second color. Shared by the board links and the
 * People list's tie dot.
 */
export const TIE_COLOR: Record<Strength, string> = {
  close: "#e25a92", // vivid rose
  warm: "#c56a85", // dusty rose
  cold: "#a06d78", // muted mauve
  dormant: "#7d6168", // faded rose-grey
};
