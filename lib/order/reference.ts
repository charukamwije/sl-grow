/**
 * Short order references, e.g. ASW-7K3P9Q. Customers quote them on WhatsApp
 * or the phone, so the alphabet leaves out characters that are easy to
 * misread or mishear: 0/O, 1/I/L, and U/V. Six characters from 29 give
 * about 595 million codes, far more than a home-garden shop will issue.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTWXYZ";
const LENGTH = 6;
export const ORDER_REF_PREFIX = "ASW-";

const PATTERN = new RegExp(`^${ORDER_REF_PREFIX}[${ALPHABET}]{${LENGTH}}$`);

export function generateOrderRef(
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes)
): string {
  // Rejection sampling keeps every character equally likely
  const limit = 256 - (256 % ALPHABET.length);
  let code = "";
  while (code.length < LENGTH) {
    for (const byte of random(new Uint8Array(LENGTH * 2))) {
      if (byte < limit && code.length < LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return ORDER_REF_PREFIX + code;
}

export function isOrderRef(value: unknown): value is string {
  return typeof value === "string" && PATTERN.test(value);
}

export const APPLICATION_REF_PREFIX = "APP-";

/** Certification applications (Join page), e.g. APP-7K3P9Q */
export function generateApplicationRef(): string {
  return generateOrderRef().replace(ORDER_REF_PREFIX, APPLICATION_REF_PREFIX);
}

export const CERTIFICATE_CODE_PREFIX = "ASW-C-";

const CERTIFICATE_PATTERN = new RegExp(`^${CERTIFICATE_CODE_PREFIX}[${ALPHABET}]{${LENGTH}}$`);

/** A certificate's public code, e.g. ASW-C-7K3P9Q, shown at /verify/<code> */
export function generateCertificateCode(): string {
  return generateOrderRef().replace(ORDER_REF_PREFIX, CERTIFICATE_CODE_PREFIX);
}

export function isCertificateCode(value: unknown): value is string {
  return typeof value === "string" && CERTIFICATE_PATTERN.test(value);
}
