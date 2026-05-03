// Best-effort wordlist filter. Hits substring matches in a normalised string.
// Keep it small and focused on slurs / overtly hostile terms — false positives
// are worse than false negatives for a guestbook with no review queue.
const WORDLIST: readonly string[] = [
  "nigger",
  "nigga",
  "faggot",
  "tranny",
  "kike",
  "chink",
  "spic",
  "retard",
  "cunt",
  "dyke",
  "wetback",
  "gook",
  "raghead",
  "kill yourself",
  "kys",
  "heil hitler",
];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
};

function normalise(input: string): string {
  const lower = input.toLowerCase();
  let mapped = "";
  for (const ch of lower) mapped += LEET[ch] ?? ch;
  return mapped.replace(/[^a-z ]+/g, "");
}

export function containsProfanity(...inputs: (string | null | undefined)[]): boolean {
  const s = normalise(inputs.filter((x): x is string => !!x).join(" "));
  if (!s) return false;
  for (const w of WORDLIST) {
    if (s.includes(w)) return true;
  }
  return false;
}
