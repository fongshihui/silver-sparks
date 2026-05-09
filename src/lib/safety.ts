export type SafetyLevel = "low" | "medium" | "high";

export type SafetyCategory =
  | "money"
  | "urgency"
  | "off_platform"
  | "isolation"
  | "credentials";

export type SafetyReason = {
  category: SafetyCategory;
  /** Short human-readable phrase for inline badges. */
  label: string;
  /** Specific term in the message that triggered this reason. */
  match: string;
};

export type SafetyResult = {
  level: SafetyLevel;
  reasons: SafetyReason[];
  /** Single-line summary for moderation UI. */
  message: string;
  suggestedReply?: string;
};

const CATEGORY_LABEL: Record<SafetyCategory, string> = {
  money: "Mentions money, transfers, or crypto.",
  urgency: "Uses urgency or pressure language.",
  off_platform: "Pushes to move off the app.",
  isolation: "Tries to isolate you from advice or help.",
  credentials: "Asks for sensitive personal or banking details.",
};

type Rule = {
  category: SafetyCategory;
  pattern: RegExp;
  /** When true a single match is enough to push the result to "high". */
  smokingGun?: boolean;
};

/**
 * Word-boundary matcher that handles em-dashes and punctuation around terms.
 * Use `\b` plus a non-letter lookaround so "transfer" matches inside
 * "wire transfer" but not inside "transferring" — actually we want both;
 * we use plain substring matching for short tokens and explicit phrase
 * regexes for multi-word phrases.
 */
function phrase(p: string): RegExp {
  // Escape regex specials, allow flexible whitespace/dashes between tokens.
  const escaped = p
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s\\-—_]+");
  return new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:[^a-z0-9]|$)`, "i");
}

const RULES: Rule[] = [
  // Money & financial — smoking guns
  { category: "money", pattern: phrase("wire transfer"), smokingGun: true },
  { category: "money", pattern: phrase("bank transfer"), smokingGun: true },
  { category: "money", pattern: phrase("gift card"), smokingGun: true },
  { category: "money", pattern: phrase("western union"), smokingGun: true },
  { category: "money", pattern: phrase("send money"), smokingGun: true },
  { category: "money", pattern: phrase("send me money"), smokingGun: true },
  { category: "money", pattern: phrase("need money") },
  { category: "money", pattern: phrase("loan me") },
  { category: "money", pattern: phrase("pay me") },
  // Money — generic terms (with word boundaries)
  { category: "money", pattern: /\b(money|cash|funds?)\b/i },
  { category: "money", pattern: /\b(crypto|bitcoin|btc|eth|usdt|usdc)\b/i },
  { category: "money", pattern: /\b(transfer|wired?|wiring|remit|remittance)\b/i },
  { category: "money", pattern: /\b(loan|deposit|invest(ment)?|withdraw)\b/i },
  { category: "money", pattern: phrase("voucher") },
  { category: "money", pattern: phrase("steam card") },
  { category: "money", pattern: phrase("itunes card") },

  // Urgency & pressure
  { category: "urgency", pattern: /\b(urgent|urgently|emergency)\b/i },
  { category: "urgency", pattern: /\b(asap)\b/i },
  { category: "urgency", pattern: phrase("right now") },
  { category: "urgency", pattern: phrase("right away") },
  { category: "urgency", pattern: /\bimmediately\b/i },
  { category: "urgency", pattern: /\b(today|tonight)\b/i },
  { category: "urgency", pattern: phrase("as soon as possible") },
  { category: "urgency", pattern: phrase("hurry up") },

  // Off-platform contact
  { category: "off_platform", pattern: /\bwhats[\s\-]?app\b/i, smokingGun: true },
  { category: "off_platform", pattern: /\btelegram\b/i, smokingGun: true },
  { category: "off_platform", pattern: /\bwechat\b/i },
  { category: "off_platform", pattern: /\bviber\b/i },
  { category: "off_platform", pattern: /\bsignal\b/i },
  { category: "off_platform", pattern: phrase("email me") },
  { category: "off_platform", pattern: phrase("text me") },
  { category: "off_platform", pattern: phrase("phone number") },
  { category: "off_platform", pattern: phrase("my number is") },
  { category: "off_platform", pattern: phrase("call me on") },
  { category: "off_platform", pattern: /\bsms\b/i },

  // Isolation / secrecy
  { category: "isolation", pattern: phrase("keep it secret"), smokingGun: true },
  { category: "isolation", pattern: phrase("keep this secret"), smokingGun: true },
  { category: "isolation", pattern: phrase("our secret"), smokingGun: true },
  { category: "isolation", pattern: phrase("between us") },
  { category: "isolation", pattern: phrase("don't tell") },
  { category: "isolation", pattern: phrase("do not tell") },
  { category: "isolation", pattern: phrase("don't tell anyone") },
  { category: "isolation", pattern: phrase("no one else") },
  { category: "isolation", pattern: phrase("trust me") },
  { category: "isolation", pattern: phrase("just between us") },

  // Credentials & sensitive details
  { category: "credentials", pattern: phrase("bank account"), smokingGun: true },
  { category: "credentials", pattern: phrase("account number"), smokingGun: true },
  { category: "credentials", pattern: phrase("routing number"), smokingGun: true },
  { category: "credentials", pattern: phrase("ssn"), smokingGun: true },
  { category: "credentials", pattern: phrase("social security"), smokingGun: true },
  { category: "credentials", pattern: phrase("nric") },
  { category: "credentials", pattern: phrase("ic number") },
  { category: "credentials", pattern: phrase("passport number") },
  { category: "credentials", pattern: phrase("credit card") },
  { category: "credentials", pattern: phrase("cvv") },
  { category: "credentials", pattern: phrase("one[\\s\\-]?time password") },
  { category: "credentials", pattern: phrase("otp") },
  { category: "credentials", pattern: phrase("verification code") },
];

function findReasons(text: string): SafetyReason[] {
  const seenByCategory = new Set<string>();
  const reasons: SafetyReason[] = [];
  for (const rule of RULES) {
    const m = rule.pattern.exec(text);
    if (!m) continue;
    const matchedTerm = (m[1] ?? m[0]).trim().toLowerCase();
    const dedupeKey = `${rule.category}:${matchedTerm}`;
    if (seenByCategory.has(dedupeKey)) continue;
    seenByCategory.add(dedupeKey);
    reasons.push({
      category: rule.category,
      label: CATEGORY_LABEL[rule.category],
      match: matchedTerm,
    });
  }
  return reasons;
}

export function localHeuristicSafetyCheck(text: string): SafetyResult {
  const reasons = findReasons(text);

  // Deduplicate by category for level computation; we still keep all reasons
  // so the UI can show specific matched terms in chips.
  const categoriesMatched = new Set(reasons.map((r) => r.category));

  // Smoking-gun rules that fired in this text.
  const smokingGuns = RULES.filter((r) => r.smokingGun && r.pattern.test(text));
  const distinctSmokingCategories = new Set(smokingGuns.map((r) => r.category)).size;

  let level: SafetyLevel = "low";
  if (
    categoriesMatched.size >= 3 ||
    distinctSmokingCategories >= 2 ||
    smokingGuns.length >= 3
  ) {
    level = "high";
  } else if (categoriesMatched.size >= 1) {
    level = "medium";
  }

  const summary =
    reasons.length > 0
      ? Array.from(categoriesMatched)
          .map((c) => CATEGORY_LABEL[c])
          .join(" ")
      : "Our safety tools flagged this conversation.";

  const suggestedReply =
    level === "low"
      ? undefined
      : "I prefer to keep chatting here for now. I don’t send money or share bank details. If we keep talking, maybe we can meet in a public place.";

  return {
    level,
    reasons,
    message: summary,
    suggestedReply,
  };
}
