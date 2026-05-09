export type SafetyLevel = "low" | "medium" | "high";

export type SafetyResult = {
  level: SafetyLevel;
  reasons: string[];
  suggestedReply?: string;
};

export function localHeuristicSafetyCheck(message: string): SafetyResult {
  const text = message.toLowerCase();
  const reasons: string[] = [];

  const moneySignals = [
    "transfer",
    "wire",
    "bank",
    "crypto",
    "bitcoin",
    "usdt",
    "gift card",
    "voucher",
    "western union",
    "money",
    "loan",
  ];
  const urgencySignals = ["urgent", "asap", "today", "right now", "immediately"];
  const offPlatformSignals = [
    "whatsapp",
    "telegram",
    "line",
    "wechat",
    "signal",
    "email me",
    "text me",
    "phone number",
  ];
  const isolationSignals = [
    "don't tell",
    "keep it secret",
    "between us",
    "trust me",
    "no one else",
  ];

  const hasAny = (arr: string[]) => arr.some((s) => text.includes(s));

  if (hasAny(moneySignals)) reasons.push("Mentions money, transfers, or crypto.");
  if (hasAny(urgencySignals)) reasons.push("Uses urgency or pressure language.");
  if (hasAny(offPlatformSignals))
    reasons.push("Pushes to move off the app quickly.");
  if (hasAny(isolationSignals))
    reasons.push("Tries to isolate you from advice or help.");

  let level: SafetyLevel = "low";
  if (reasons.length >= 3) level = "high";
  else if (reasons.length >= 1) level = "medium";

  const suggestedReply =
    level === "low"
      ? undefined
      : "I prefer to keep chatting here for now. I don’t send money or share bank details. If we keep talking, maybe we can meet in a public place.";

  return { level, reasons, suggestedReply };
}

