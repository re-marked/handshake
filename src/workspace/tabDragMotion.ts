import { motionValue } from "motion/react";

/**
 * The live cursor position during a tab drag, shared between the writer (TabStrip's pointer
 * handler) and the reader (TabDragGhost, which springs toward it). Module-level so updating it
 * never triggers a React re-render – the ghost follows via a motion spring instead.
 */
export const dragX = motionValue(0);
export const dragY = motionValue(0);
