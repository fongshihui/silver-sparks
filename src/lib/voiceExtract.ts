/**
 * Light-weight, deterministic intent extraction from voice transcripts.
 *
 * For prompts that auto-fill structured profile fields (e.g. "name") we want
 * "My name is Peter" to become just "Peter". For free-form prompts we keep
 * the user's own words.
 */

export type ExtractorFn = (raw: string) => string;

/** Trim, drop wrapping quotes, normalise whitespace. */
function tidy(input: string): string {
  return input
    .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s"'.,!?;:]+|[\s"'.,!?;:]+$/g, "")
    .trim();
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  // Preserve mid-word capitals (e.g. "McDonald", "DeShawn")
  if (word.length > 1 && /[A-Z]/.test(word.slice(1))) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const FILLER_WORDS = new Set([
  "um",
  "uh",
  "uhm",
  "er",
  "ah",
  "well",
  "like",
  "okay",
  "ok",
  "so",
  "hey",
  "hi",
  "hello",
  "yeah",
  "yes",
]);

const NAME_PREFIX_PATTERNS: RegExp[] = [
  // English
  /^(?:my\s+name(?:\s+is|'s|s)?)\s+(.+)$/i,
  /^(?:i\s+am\s+(?:called|known\s+as))\s+(.+)$/i,
  /^(?:i'?m\s+(?:called|known\s+as))\s+(.+)$/i,
  /^(?:i\s+go\s+by)\s+(.+)$/i,
  /^(?:you\s+(?:can|could|may)\s+call\s+me)\s+(.+)$/i,
  /^(?:(?:everyone|everybody|people|they|friends|folks)\s+call\s+me)\s+(.+)$/i,
  /^(?:just\s+call\s+me)\s+(.+)$/i,
  /^(?:call\s+me)\s+(.+)$/i,
  /^(?:name(?:'s|\s+is))\s+(.+)$/i,
  /^(?:this\s+is)\s+(.+)$/i,
  /^(?:it'?s)\s+(.+)$/i,
  /^(?:i'?m)\s+(.+)$/i,
  /^(?:i\s+am)\s+(.+)$/i,
  // Spanish
  /^(?:me\s+llamo)\s+(.+)$/i,
  /^(?:mi\s+nombre\s+es)\s+(.+)$/i,
  /^(?:soy)\s+(.+)$/i,
  // French
  /^(?:je\s+m'appelle)\s+(.+)$/i,
  /^(?:mon\s+nom\s+est)\s+(.+)$/i,
];

/** Drop any trailing clause like ", and I love gardening" so just the name remains. */
function trimAfterName(s: string): string {
  return s
    .split(/\s+(?:and|but|because|so|though|although)\s+/i)[0]
    .split(/[,;:.!?]/)[0]
    .trim();
}

function stripLeadingFillers(words: string[]): string[] {
  let i = 0;
  while (
    i < words.length &&
    FILLER_WORDS.has(words[i].toLowerCase().replace(/[^a-z']/g, ""))
  ) {
    i++;
  }
  return words.slice(i);
}

/**
 * Turn raw speech-to-text into a profile-ready name.
 *
 * Examples:
 *   "My name is Peter"          -> "Peter"
 *   "Hi, I'm Peter Johnson"     -> "Peter Johnson"
 *   "Just call me Pete, please" -> "Pete"
 *   "Peter"                     -> "Peter"
 *   "they call me grandma jo"   -> "Grandma Jo"
 */
export function extractName(raw: string): string {
  let s = tidy(raw);
  if (!s) return "";

  let words = stripLeadingFillers(s.split(/\s+/));
  s = words.join(" ");

  for (const pattern of NAME_PREFIX_PATTERNS) {
    const match = s.match(pattern);
    if (match && match[1]) {
      s = match[1].trim();
      break;
    }
  }

  s = trimAfterName(s);
  s = s.replace(/^[\s"'.,!?;:]+|[\s"'.,!?;:]+$/g, "").trim();
  if (!s) return "";

  words = s.split(/\s+/).filter(Boolean);
  // Most names are 1-3 tokens; cap at 4 for "Mary Anne van Der Berg"-style names.
  return words.slice(0, 4).map(capitalizeWord).join(" ");
}

/** Trim only — used for free-form answers that get stored verbatim. */
export function extractFreeform(raw: string): string {
  return raw.trim();
}

/** Map a prompt id to its extractor. Unknown ids fall back to verbatim. */
const EXTRACTORS: Record<string, ExtractorFn> = {
  nickname: extractName,
};

export function extractFromAnswer(promptId: string, raw: string): string {
  const fn = EXTRACTORS[promptId] ?? extractFreeform;
  return fn(raw);
}

/** True if the prompt has a structured extractor (vs. verbatim freeform). */
export function hasStructuredExtractor(promptId: string): boolean {
  return promptId in EXTRACTORS;
}
