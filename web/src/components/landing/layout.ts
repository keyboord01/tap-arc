/**
 * Shared landing layout classes. Fluid values are clamp()s that land exactly on the
 * design's pixel sizes at 1440px wide (e.g. 6.6667vw x 1440 = 96px of side padding).
 */
export const container = "mx-auto max-w-[1440px] px-[clamp(20px,6.6667vw,96px)]";

/** Section heading: 52px at 1440, down to 34px on phones. */
export const sectionHeading =
  "m-0 font-display text-[clamp(34px,3.6112vw,52px)] leading-[1.05] font-bold tracking-[-0.03em] text-ink tabular-nums";
