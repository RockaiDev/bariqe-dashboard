export const DEFAULT_COUNTRY_CODE = "+966";

export const COUNTRY_PHONE_OPTIONS = [
  { code: "+966", flag: "🇸🇦" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+965", flag: "🇰🇼" },
  { code: "+973", flag: "🇧🇭" },
  { code: "+974", flag: "🇶🇦" },
  { code: "+968", flag: "🇴🇲" },
  { code: "+20", flag: "🇪🇬" },
  { code: "+962", flag: "🇯🇴" },
] as const;

const PHONE_RULES: Record<string, RegExp> = {
  "+966": /^5\d{8}$/,
  "+971": /^5\d{8}$/,
  "+965": /^\d{8}$/,
  "+973": /^\d{8}$/,
  "+974": /^\d{8}$/,
  "+968": /^\d{8}$/,
  "+20": /^1\d{9}$/,
  "+962": /^7\d{8}$/,
};

export const SUPPORTED_COUNTRY_CODES = COUNTRY_PHONE_OPTIONS.map(
  (item) => item.code
);

export function normalizeLocalPhoneInput(
  value: string,
  countryCode: string
): string {
  const code = countryCode.replace("+", "");
  let normalized = value.replace(/[^0-9]/g, "");

  if (code && normalized.startsWith(code)) {
    normalized = normalized.slice(code.length);
  }

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  return normalized;
}

export function isValidLocalPhoneForCountry(
  localPhone: string,
  countryCode: string
): boolean {
  const rule = PHONE_RULES[countryCode];
  if (!rule) return /^\d{8,15}$/.test(localPhone);
  return rule.test(localPhone);
}

export function parseStoredInternationalPhone(fullPhone?: string): {
  countryCode: string;
  localPhone: string;
} {
  if (!fullPhone || !fullPhone.startsWith("+")) {
    return { countryCode: DEFAULT_COUNTRY_CODE, localPhone: "" };
  }

  const matchedCode = [...SUPPORTED_COUNTRY_CODES]
    .sort((a, b) => b.length - a.length)
    .find((code) => fullPhone.startsWith(code));

  if (!matchedCode) {
    return { countryCode: DEFAULT_COUNTRY_CODE, localPhone: "" };
  }

  const localPhone = normalizeLocalPhoneInput(fullPhone, matchedCode);
  return { countryCode: matchedCode, localPhone };
}
