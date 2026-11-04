/**
 * Links for sharing a certificate. LinkedIn's "Add to profile" link fills in
 * the Licenses & certifications form, with the /verify page as the
 * credential URL employers can check.
 */
export type ShareableCertificate = {
  /** English, as on the certificate */
  trackName: string;
  code: string;
  /** Absolute URL of the /verify page */
  url: string;
  issuedAt: string;
  expiresAt: string;
};

export const ORGANIZATION_NAME = "Aswedduma";

function yearMonth(iso: string) {
  const date = new Date(iso);
  return { year: String(date.getUTCFullYear()), month: String(date.getUTCMonth() + 1) };
}

export function linkedInAddToProfile(cert: ShareableCertificate): string {
  const issued = yearMonth(cert.issuedAt);
  const expires = yearMonth(cert.expiresAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.trackName,
    organizationName: ORGANIZATION_NAME,
    issueYear: issued.year,
    issueMonth: issued.month,
    expirationYear: expires.year,
    expirationMonth: expires.month,
    certUrl: cert.url,
    certId: cert.code,
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

/** The text a post starts with; the link's preview carries the image */
export function shareText(cert: ShareableCertificate): string {
  return `I am now ${cert.trackName}! Verify my certificate:`;
}

export function shareLinks(cert: ShareableCertificate) {
  const url = encodeURIComponent(cert.url);
  const text = encodeURIComponent(shareText(cert));

  return {
    linkedInPost: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://x.com/intent/post?text=${text}&url=${url}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText(cert)} ${cert.url}`)}`,
  };
}
