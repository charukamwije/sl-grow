import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubSupabaseEnv, supabaseDouble } from "../helpers/supabase-double";

const server = vi.hoisted(() => ({
  createApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
  getCertificate: vi.fn(),
}));
const image = vi.hoisted(() => ({ renderCertificateImage: vi.fn() }));

vi.mock("@/lib/supabase/admin", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { adminDb: supabaseDouble.admin };
});
vi.mock("@/lib/supabase/server", async () => {
  const { supabaseDouble } = await import("../helpers/supabase-double");
  return { createClient: async () => supabaseDouble.client };
});
vi.mock("@/lib/certifications-server", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...server,
}));
vi.mock("@/lib/certificate-image", () => image);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { POST } = await import("@/app/api/certifications/route");
const { setApplicationStatus } = await import("@/app/admin/certifications/actions");
const { GET: IMAGE } = await import("@/app/verify/[code]/certificate.png/route");
const { AlreadyCertifiedError, OpenApplicationError } = await import("@/lib/certifications-server");

const HEADERS = {
  host: "example.com",
  origin: "https://example.com",
  "content-type": "application/json",
};

const APPLICATION = {
  track: "home-grower",
  name: "Kamala",
  phone: "0771234567",
  location: "Kandy",
  notes: "",
};

function applyRequest(body: unknown, headers: Record<string, string> = HEADERS) {
  return new NextRequest("https://example.com/api/certifications", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  supabaseDouble.reset();
  stubSupabaseEnv();
  vi.spyOn(console, "error").mockImplementation(() => {});
  server.createApplication.mockResolvedValue({ id: "app-1", ref: "APP-7K3P9Q" });
  server.updateApplicationStatus.mockResolvedValue(true);
  image.renderCertificateImage.mockResolvedValue(new Response("png", { headers: { "Content-Type": "image/png" } }));
});

describe("POST /api/certifications", () => {
  it("asks a guest to sign in", async () => {
    const response = await POST(applyRequest(APPLICATION));

    expect(response.status).toBe(401);
    expect(server.createApplication).not.toHaveBeenCalled();
  });

  it("saves the application under the session's user and answers with its reference", async () => {
    supabaseDouble.givenUser("user-1");

    const response = await POST(applyRequest({ ...APPLICATION, user_id: "user-2" }));

    await expect(response.json()).resolves.toEqual({ success: true, id: "app-1", ref: "APP-7K3P9Q" });
    expect(server.createApplication).toHaveBeenCalledWith("user-1", APPLICATION);
  });

  it.each([
    ["an unknown path", { track: "orchids" }],
    ["no district", { location: "" }],
  ])("refuses %s", async (_, patch) => {
    supabaseDouble.givenUser("user-1");

    const response = await POST(applyRequest({ ...APPLICATION, ...patch }));

    expect(response.status).toBe(400);
    expect(server.createApplication).not.toHaveBeenCalled();
  });

  it.each([
    [new OpenApplicationError(), "open"],
    [new AlreadyCertifiedError(), "certified"],
  ])("answers 409 when the person may not apply again (%s)", async (error, code) => {
    supabaseDouble.givenUser("user-1");
    server.createApplication.mockRejectedValue(error);

    const response = await POST(applyRequest(APPLICATION));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: code });
  });

  it("rejects a cross-site request", async () => {
    supabaseDouble.givenUser("user-1");

    const response = await POST(applyRequest(APPLICATION, { ...HEADERS, origin: "https://attacker.example" }));

    expect(response.status).toBe(403);
  });
});

describe("setApplicationStatus", () => {
  const ID = "0b6f6d4e-1c1a-4c3e-9a51-6c5d8f2e7a10";
  const future = new Date();
  future.setUTCFullYear(future.getUTCFullYear() + 2);
  const expiry = future.toISOString().slice(0, 10);

  it.each(["admin", "super_admin"] as const)("lets a %s certify with an expiry, and records it", async (role) => {
    supabaseDouble.givenUser("staff", { role });

    await expect(setApplicationStatus(ID, "certified", "  Well done!  ", expiry)).resolves.toEqual({ ok: true });

    expect(server.updateApplicationStatus).toHaveBeenCalledWith(
      ID,
      { status: "certified", note: "Well done!", expiresAt: `${expiry}T23:59:59.999Z` },
      "staff"
    );
    expect(supabaseDouble.auditRows).toEqual([
      expect.objectContaining({ action: "certification.status_changed", target: ID }),
    ]);
  });

  it("puts an application on hold with a note and no expiry", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });

    await setApplicationStatus(ID, "on_hold", "Please send a photo.", "ignored");

    expect(server.updateApplicationStatus).toHaveBeenCalledWith(
      ID,
      { status: "on_hold", note: "Please send a photo.", expiresAt: null },
      "staff"
    );
  });

  it("refuses to certify without a future expiry", async () => {
    supabaseDouble.givenUser("staff", { role: "admin" });

    await expect(setApplicationStatus(ID, "certified", "", "2020-01-01")).resolves.toMatchObject({ ok: false });
    expect(server.updateApplicationStatus).not.toHaveBeenCalled();
  });

  it("refuses a member, an unknown status and a long note", async () => {
    supabaseDouble.givenUser("customer", { role: "member" });
    await expect(setApplicationStatus(ID, "in_review", "", "")).resolves.toMatchObject({ ok: false });

    supabaseDouble.givenUser("staff", { role: "admin" });
    await expect(setApplicationStatus(ID, "approved", "", "")).resolves.toMatchObject({ ok: false });
    await expect(setApplicationStatus(ID, "in_review", "x".repeat(1001), "")).resolves.toMatchObject({ ok: false });

    expect(server.updateApplicationStatus).not.toHaveBeenCalled();
    expect(supabaseDouble.auditRows).toEqual([]);
  });
});

describe("GET /verify/<code>/certificate.png", () => {
  const params = (code: string) => ({ params: Promise.resolve({ code }) });
  const cert = {
    code: "ASW-C-7K3P9Q",
    name: "Kamala",
    track: "seeds",
    issuedAt: "2026-11-04T10:00:00.000Z",
    expiresAt: "2028-11-04T23:59:59.999Z",
    state: "valid",
    ownerId: "user-1",
  };

  it("draws the certificate for a known code", async () => {
    server.getCertificate.mockResolvedValue(cert);

    const response = await IMAGE(
      new NextRequest("https://example.com/verify/ASW-C-7K3P9Q/certificate.png"),
      params("ASW-C-7K3P9Q")
    );

    expect(response.headers.get("Content-Type")).toBe("image/png");
    const [, , headers] = image.renderCertificateImage.mock.calls[0];
    expect(headers).not.toHaveProperty("Content-Disposition");
  });

  it("offers it as a download with ?download=1", async () => {
    server.getCertificate.mockResolvedValue(cert);

    await IMAGE(
      new NextRequest("https://example.com/verify/ASW-C-7K3P9Q/certificate.png?download=1"),
      params("ASW-C-7K3P9Q")
    );

    const [, , headers] = image.renderCertificateImage.mock.calls[0];
    expect(headers["Content-Disposition"]).toBe(
      'attachment; filename="aswedduma-certificate-ASW-C-7K3P9Q.png"'
    );
  });

  it("answers 404 for an unknown or malformed code, without asking the database for the latter", async () => {
    server.getCertificate.mockResolvedValue(null);

    const unknown = await IMAGE(new NextRequest("https://example.com/x"), params("ASW-C-222222"));
    const malformed = await IMAGE(new NextRequest("https://example.com/x"), params("../../etc"));

    expect(unknown.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(server.getCertificate).toHaveBeenCalledTimes(1);
    expect(image.renderCertificateImage).not.toHaveBeenCalled();
  });
});
