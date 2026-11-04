import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CertificateView from "@/components/join/CertificateView";
import { getCertificate } from "@/lib/certifications-server";
import { getTrack } from "@/lib/data/certifications";
import { isCertificateCode } from "@/lib/order/reference";
import { SITE_URL } from "@/lib/site";
import { getServerUser } from "@/lib/supabase/auth-server";

type VerifyProps = { params: Promise<{ code: string }> };

async function load(code: string) {
  return isCertificateCode(code) ? getCertificate(code) : null;
}

/**
 * Link previews on LinkedIn, Facebook, X and WhatsApp show the certificate
 * image, so a shared link carries the certificate itself.
 */
export async function generateMetadata({ params }: VerifyProps): Promise<Metadata> {
  const { code } = await params;
  const certificate = await load(code);
  if (!certificate) return { title: "Certificate not found", robots: { index: false } };

  const track = getTrack(certificate.track)!;
  const title = `${certificate.name} · ${track.name.en}`;
  const description = `${certificate.name} is ${track.name.en}. Certificate ${certificate.code}, issued by Aswedduma.`;
  const image = {
    url: `${SITE_URL}/verify/${code}/certificate.png`,
    width: 1200,
    height: 630,
    alt: `${track.name.en} certificate for ${certificate.name}`,
  };

  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, url: `${SITE_URL}/verify/${code}`, type: "article", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function VerifyPage({ params }: VerifyProps) {
  const { code } = await params;
  const [certificate, viewer] = await Promise.all([load(code), getServerUser()]);
  if (!certificate) notFound();

  return (
    <CertificateView
      code={certificate.code}
      name={certificate.name}
      track={certificate.track}
      issuedAt={certificate.issuedAt}
      expiresAt={certificate.expiresAt}
      state={certificate.state}
      url={`${SITE_URL}/verify/${code}`}
      isOwner={viewer?.uid === certificate.ownerId}
    />
  );
}
