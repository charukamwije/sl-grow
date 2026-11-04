import { describe, expect, it } from "vitest";
import { parseApplicationFilters, applicationFiltersQuery } from "@/lib/certification/filters";
import { linkedInAddToProfile, shareLinks } from "@/lib/certification/share";
import {
  certificateState,
  defaultExpiry,
  parseApplication,
  parseExpiry,
} from "@/lib/certification/status";
import { generateCertificateCode, isCertificateCode } from "@/lib/order/reference";

const NOW = new Date("2026-11-04T10:00:00Z");

describe("certificateState", () => {
  it("is valid while certified and before its expiry", () => {
    expect(certificateState({ status: "certified", expiresAt: "2028-11-04T23:59:59Z" }, NOW)).toBe("valid");
  });

  it("is expired once the expiry has passed", () => {
    expect(certificateState({ status: "certified", expiresAt: "2026-11-03T23:59:59Z" }, NOW)).toBe("expired");
  });

  it.each(["applied", "in_review", "on_hold", "rejected"] as const)(
    "is no longer valid once moved back to %s",
    (status) => {
      expect(certificateState({ status, expiresAt: "2028-11-04T23:59:59Z" }, NOW)).toBe("revoked");
    }
  );
});

describe("expiry dates", () => {
  it("starts 2 years on", () => {
    expect(defaultExpiry(NOW)).toBe("2028-11-04");
  });

  it("accepts a date ahead and keeps the certificate valid through that day", () => {
    expect(parseExpiry("2028-11-04", NOW)).toBe("2028-11-04T23:59:59.999Z");
  });

  it.each(["2026-11-03", "2037-01-01", "2028-02-30", "next year", "", null])(
    "refuses %p",
    (value) => {
      expect(parseExpiry(value, NOW)).toBeNull();
    }
  );

  it("allows exactly 10 years", () => {
    expect(parseExpiry("2036-11-03", NOW)).not.toBeNull();
  });
});

describe("parseApplication", () => {
  const valid = {
    track: "seeds",
    name: " Kamala ",
    phone: "0771234567",
    location: "Kandy",
    notes: "",
  };

  it("reads and trims a complete application", () => {
    expect(parseApplication(valid)).toEqual({ ...valid, name: "Kamala" });
  });

  it("treats missing notes as empty", () => {
    const { notes, ...rest } = valid;
    void notes;
    expect(parseApplication(rest)?.notes).toBe("");
  });

  it.each([
    ["an unknown path", { track: "orchids" }],
    ["no name", { name: "  " }],
    ["no phone", { phone: "" }],
    ["no district", { location: "" }],
    ["a name that is too long", { name: "x".repeat(121) }],
    ["notes that are too long", { notes: "x".repeat(1001) }],
  ])("refuses %s", (_, patch) => {
    expect(parseApplication({ ...valid, ...patch })).toBeNull();
  });
});

describe("certificate codes", () => {
  it("look like ASW-C- and six easy-to-read characters", () => {
    const code = generateCertificateCode();
    expect(code).toMatch(/^ASW-C-[2-9A-HJKMNP-TW-Z]{6}$/);
    expect(isCertificateCode(code)).toBe(true);
  });

  it.each(["ASW-7K3P9Q", "ASW-C-7K3P9", "ASW-C-OOOOOO", "asw-c-7k3p9q", null])(
    "rejects %p",
    (value) => {
      expect(isCertificateCode(value)).toBe(false);
    }
  );
});

describe("share links", () => {
  const cert = {
    trackName: "Aswedduma Certified Seeds",
    code: "ASW-C-7K3P9Q",
    url: "https://aswedduma.example/verify/ASW-C-7K3P9Q",
    issuedAt: "2026-11-04T10:00:00.000Z",
    expiresAt: "2028-11-04T23:59:59.999Z",
  };

  it("fills in LinkedIn's Licenses & certifications form", () => {
    const url = new URL(linkedInAddToProfile(cert));

    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      startTask: "CERTIFICATION_NAME",
      name: "Aswedduma Certified Seeds",
      organizationName: "Aswedduma",
      issueYear: "2026",
      issueMonth: "11",
      expirationYear: "2028",
      expirationMonth: "11",
      certUrl: cert.url,
      certId: "ASW-C-7K3P9Q",
    });
  });

  it("shares the verify link everywhere", () => {
    const links = shareLinks(cert);
    const encoded = encodeURIComponent(cert.url);

    expect(links.linkedInPost).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`);
    expect(links.facebook).toContain(encoded);
    expect(links.x).toContain(encoded);
    expect(decodeURIComponent(links.whatsapp)).toContain(cert.url);
  });
});

describe("application filters", () => {
  it("reads a search, a status, a path and a page", () => {
    expect(
      parseApplicationFilters({ q: "APP-7K, ", status: "on_hold", track: "seeds", page: "2" })
    ).toEqual({ q: "APP-7K", status: "on_hold", track: "seeds", page: 2 });
  });

  it("ignores what it does not know", () => {
    expect(parseApplicationFilters({ status: "lost", track: "orchids", page: "0" })).toEqual({
      q: "",
      status: null,
      track: null,
      page: 1,
    });
  });

  it("keeps the filters across pages", () => {
    const filters = parseApplicationFilters({ status: "applied", track: "seeds" });
    expect(applicationFiltersQuery(filters, 3)).toBe("?status=applied&track=seeds&page=3");
  });
});
