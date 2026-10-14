/**
 * Phone-number normalizer.
 *
 * The workspace receives phone numbers from many sources (CSV imports, TCN
 * journeys, manual entry on the customer profile, support tickets, etc.).
 * They arrive in every shape — `+91-98765 43210`, `09876543210`, `91 91
 * 9876543210` (someone double-stamped the country code), `(987) 654-3210`,
 * a stray Excel apostrophe in front, and so on.
 *
 * `normalizePhone()` is the single funnel that turns those inputs into a
 * predictable shape:
 *   - `e164`      — `+CCNNNNNNNNNN`, e.g. `+919876543210`. Empty when
 *                    the input couldn't be parsed.
 *   - `national`  — national-significant-number (no country code, no
 *                    trunk prefix).
 *   - `countryCode` — detected dial code (no `+`), falls back to the
 *                    workspace default (India / `91`).
 *   - `isValid`   — whether the number passes the length rule for the
 *                    detected country.
 *
 * The implementation deliberately stays library-free — keeps the bundle
 * small and the rule set explicit. We cover the country codes the
 * workspace actually sees in practice (India, US/CA, UK, AU, SG, AE).
 * Add a row to `COUNTRIES` to support a new country.
 */

const DEFAULT_COUNTRY_CODE = "91";

interface CountryRule {
  /** Dial code, no leading `+`. */
  code: string;
  /** Inclusive min length of the national-significant-number. */
  minLen: number;
  /** Inclusive max length of the national-significant-number. */
  maxLen: number;
  /**
   * Trunk prefix to strip if the national-significant-number is too
   * long (e.g. Indian numbers written as `09876543210` carry a leading
   * `0` that the dialer must drop).
   */
  trunkPrefix?: string;
}

// Ordered: codes the workspace deals with most frequently first.
// Sort doesn't matter for correctness — the matcher below sorts by
// length descending so longer codes ("971") win over their prefixes.
const COUNTRIES: CountryRule[] = [
  { code: "91",  minLen: 10, maxLen: 10, trunkPrefix: "0" }, // India
  { code: "1",   minLen: 10, maxLen: 10 },                    // US / Canada (NANP)
  { code: "44",  minLen: 10, maxLen: 10, trunkPrefix: "0" }, // United Kingdom
  { code: "61",  minLen: 9,  maxLen: 9,  trunkPrefix: "0" }, // Australia
  { code: "65",  minLen: 8,  maxLen: 8 },                     // Singapore
  { code: "971", minLen: 8,  maxLen: 9,  trunkPrefix: "0" }, // UAE
];

const COUNTRIES_BY_LENGTH = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

function getCountryByCode(code: string): CountryRule | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export interface NormalizedPhone {
  /** E.164 form `+CCNNNNNNNNNN`, empty when the number didn't parse. */
  e164: string;
  /** National-significant-number with no country code or trunk prefix. */
  national: string;
  /** Detected country code (no `+`); falls back to the workspace default. */
  countryCode: string;
  /** `true` when length matches the detected country's rule. */
  isValid: boolean;
  /** The raw input as supplied (trimmed). Useful for debug / fallback. */
  raw: string;
}

/**
 * Normalize a phone string into an E.164 form plus its parts.
 *
 * The function always returns a `NormalizedPhone` — never throws, never
 * returns `null` — so callers can rely on `result.isValid` to gate their
 * behavior and `result.e164` to render or dial.
 *
 * Handles:
 *  - International prefixes: `+`, `00`, or no prefix at all.
 *  - Punctuation: spaces, dashes, parentheses, slashes, dots, leading `'`.
 *  - Duplicated country code (`+91 91 9876543210` → `+919876543210`).
 *  - Trunk prefix (`09876543210` in India → `9876543210`).
 *  - Already-valid input: returns it unchanged in canonical form.
 *
 * Unrecognized country codes fall back to the workspace default, so a
 * lone 10-digit number is treated as Indian unless the caller overrides.
 */
export function normalizePhone(
  input: string | null | undefined,
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
): NormalizedPhone {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return { e164: "", national: "", countryCode: defaultCountryCode, isValid: false, raw };
  }

  // `+91...` and `0091...` both signal an explicit country code is
  // attached. We treat them the same so paste-from-Excel doesn't break.
  const explicitInternational = raw.startsWith("+") || raw.startsWith("00");
  let digits = raw.replace(/[^\d]/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  if (!digits) {
    return { e164: "", national: "", countryCode: defaultCountryCode, isValid: false, raw };
  }

  let countryCode = defaultCountryCode;
  let national = digits;

  if (explicitInternational) {
    const match = COUNTRIES_BY_LENGTH.find((c) => digits.startsWith(c.code));
    if (match) {
      countryCode = match.code;
      national = digits.slice(match.code.length);
    }
  } else {
    // No explicit international prefix. If the digit string starts with
    // the default country's dial code AND the remainder is the right
    // length, prefer that interpretation over treating the whole thing
    // as a national number. Mirrors the user's mental model: copying
    // "919876543210" out of a CSV should round-trip to "+919876543210"
    // even though they didn't type a `+`.
    const defaultRule = getCountryByCode(defaultCountryCode);
    if (
      defaultRule
      && digits.startsWith(defaultCountryCode)
      && digits.length > defaultRule.maxLen
    ) {
      const remainder = digits.slice(defaultCountryCode.length);
      if (remainder.length >= defaultRule.minLen && remainder.length <= defaultRule.maxLen) {
        national = remainder;
      }
    }
  }

  const rule = getCountryByCode(countryCode);

  // Doubled-country-code recovery — e.g. "+91 91 9876543210" surfaces as
  // national = "919876543210" after the first split. If stripping the
  // country code again yields a valid-length number, prefer that.
  if (rule && national.length > rule.maxLen && national.startsWith(countryCode)) {
    const stripped = national.slice(countryCode.length);
    if (stripped.length >= rule.minLen && stripped.length <= rule.maxLen) {
      national = stripped;
    }
  }

  // Trunk-prefix strip — drop the leading `0` (or `1` in NANP-like
  // schemes) only when keeping it would push the number past the
  // country's max length. Otherwise we'd accidentally chop a real digit
  // off short numbers.
  if (rule?.trunkPrefix && national.startsWith(rule.trunkPrefix) && national.length > rule.maxLen) {
    national = national.slice(rule.trunkPrefix.length);
  }

  const isValid = rule
    ? national.length >= rule.minLen && national.length <= rule.maxLen
    : false;
  const e164 = isValid ? `+${countryCode}${national}` : "";

  return { e164, national, countryCode, isValid, raw };
}

/** True when the input parses to a valid number for some known country. */
export function isValidPhone(
  input: string | null | undefined,
  defaultCountryCode?: string,
): boolean {
  return normalizePhone(input, defaultCountryCode).isValid;
}

/**
 * Canonical E.164 form (`+CCNNNNNNNNNN`) — empty string when the input
 * didn't parse. Use for storage and display.
 */
export function toE164(
  input: string | null | undefined,
  defaultCountryCode?: string,
): string {
  return normalizePhone(input, defaultCountryCode).e164;
}

/**
 * Dial-ready form (digits only, country code prepended, no `+`). Used
 * for the TCN softphone which expects the country code stamped on the
 * number itself, not as a separate field.
 */
export function toDialFormat(
  input: string | null | undefined,
  defaultCountryCode?: string,
): string {
  const p = normalizePhone(input, defaultCountryCode);
  return p.isValid ? `${p.countryCode}${p.national}` : "";
}

/**
 * Pretty-print a phone for the UI: `+91 98765 43210`. Returns the raw
 * input when the number can't be parsed — better than rendering nothing.
 */
export function formatPhoneForDisplay(
  input: string | null | undefined,
  defaultCountryCode?: string,
): string {
  const p = normalizePhone(input, defaultCountryCode);
  if (!p.isValid) return p.raw;
  // Group as 5-5 for 10-digit numbers (India / UK / NANP), 4-4 for 8s,
  // 3-3-3 for 9s. Keeps the country code as its own segment.
  const n = p.national;
  let body = n;
  if (n.length === 10) body = `${n.slice(0, 5)} ${n.slice(5)}`;
  else if (n.length === 9) body = `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  else if (n.length === 8) body = `${n.slice(0, 4)} ${n.slice(4)}`;
  return `+${p.countryCode} ${body}`;
}
