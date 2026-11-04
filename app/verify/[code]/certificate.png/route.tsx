import { NextRequest, NextResponse } from "next/server";
import { renderCertificateImage } from "@/lib/certificate-image";
import { getCertificate } from "@/lib/certifications-server";
import { isCertificateCode } from "@/lib/order/reference";
import { SITE_URL } from "@/lib/site";

/**
 * The certificate as a PNG: the link preview LinkedIn and others show, and,
 * with ?download=1, the file the holder saves. Public, like the page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const certificate = isCertificateCode(code) ? await getCertificate(code) : null;

  if (!certificate) {
    return NextResponse.json({ error: "No such certificate." }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const verifyUrl = `${SITE_URL.replace(/^https?:\/\//, "")}/verify/${code}`;

  return renderCertificateImage(certificate, verifyUrl, {
    // Status can change, so previews may be cached for a short while only
    "Cache-Control": "public, max-age=300, s-maxage=300",
    ...(download
      ? { "Content-Disposition": `attachment; filename="aswedduma-certificate-${code}.png"` }
      : {}),
  });
}
