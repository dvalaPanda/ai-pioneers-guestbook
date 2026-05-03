import type { AnonHandle } from "../types";

export const ADJECTIVES = [
  "Quiet", "Curious", "Distant", "Patient", "Gilded", "Northern", "Southern",
  "Sage", "Velvet", "Marble", "Aurora", "Linen", "Brass", "Slow", "Quartz",
  "Coastal", "Hushed", "Verdant", "Ember",
] as const;

export const NOUNS = [
  "Voyager", "Wanderer", "Cartographer", "Pilgrim", "Mariner", "Astronomer",
  "Rambler", "Pioneer", "Drifter", "Compass", "Lantern", "Sojourner",
  "Atlas", "Almanac", "Steward",
] as const;

export const EMOJIS = ["✦", "✧", "☼", "☾", "◐", "◑", "◒", "◓", "❖", "✺", "◈", "◇", "◆", "✿"] as const;

export const HANDLE_REGEX = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

const adjSet: ReadonlySet<string> = new Set(ADJECTIVES);
const nounSet: ReadonlySet<string> = new Set(NOUNS);
const emojiSet: ReadonlySet<string> = new Set(EMOJIS);

export function makeAnonName(): AnonHandle {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  const e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]!;
  return { name: `${a} ${n}`, emoji: e };
}

export function isValidHandle(name: string, emoji: string): boolean {
  if (!HANDLE_REGEX.test(name)) return false;
  if (!emojiSet.has(emoji)) return false;
  const [adj, noun] = name.split(" ");
  if (!adj || !noun) return false;
  return adjSet.has(adj) && nounSet.has(noun);
}
