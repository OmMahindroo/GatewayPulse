// Profanity & Content Moderation with Sensitive Payment Data Redaction

const VULGAR_PATTERNS = [
  /\b(fuck|shit|bitch|bastard|asshole|cunt|dick|piss|slut|whore|scamster|thief|fraudster)\b/i,
  /\b(chutiya|madarchod|bhenchod|harami|bhosdike|gandu|kutta|saala)\b/i,
];

// Sensitive payment patterns
const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
const SECRET_KEY_REGEX = /\b(?:rzp_(?:test|live)_[a-zA-Z0-9]{14,24}|sk_(?:test|live)_[a-zA-Z0-9]{24,40}|key_secret_[a-zA-Z0-9]+)\b/g;

export interface ModerationResult {
  isValid: boolean;
  error?: string;
  sanitizedText: string;
  hasRedactions: boolean;
}

export function moderateContent(text: string): ModerationResult {
  if (!text || !text.trim()) {
    return {
      isValid: false,
      error: 'Content cannot be empty.',
      sanitizedText: '',
      hasRedactions: false,
    };
  }

  // 1. Check for vulgarity / profanity
  for (const pattern of VULGAR_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isValid: false,
        error: 'Your submission contains abusive or vulgar language. Please maintain an objective, professional description of the technical issue.',
        sanitizedText: text,
        hasRedactions: false,
      };
    }
  }

  // 2. Redact sensitive payment secrets and card PANs
  let sanitized = text;
  let hasRedactions = false;

  if (SECRET_KEY_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(SECRET_KEY_REGEX, '[REDACTED_API_SECRET]');
    hasRedactions = true;
  }

  if (CARD_REGEX.test(sanitized)) {
    // Only redact if string matches standard length and is not just an ID or timestamp
    sanitized = sanitized.replace(CARD_REGEX, (match) => {
      const cleanDigits = match.replace(/[\s-]/g, '');
      if (cleanDigits.length >= 13 && cleanDigits.length <= 19) {
        hasRedactions = true;
        return '[REDACTED_CARD_NUMBER]';
      }
      return match;
    });
  }

  return {
    isValid: true,
    sanitizedText: sanitized,
    hasRedactions,
  };
}
