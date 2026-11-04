// Fails the build if this module is ever pulled into a client bundle
import "server-only";
import { ImageResponse } from "next/og";
import type { PublicCertificate } from "./certifications-server";
import { getTrack } from "./data/certifications";

export const CERTIFICATE_IMAGE_SIZE = { width: 1200, height: 630 };

// The app's leaf mark and the badge's scalloped rosette (components/join/DigitalBadge.tsx)
const LEAF =
  "M47 14C29 14 17 23 17 37c0 4 1.4 7.6 3.6 10.4C24 39 31 31 40 26c-7.5 6.2-13.3 13.6-16 22.3 2.4 1.1 5 1.7 7.8 1.7C44 50 50 38 47 14Z";

function rosette(cx: number, cy: number, outer: number, inner: number, points: number) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

const SINHALA = /[඀-෿]/;
const TAMIL = /[஀-௿]/;

/**
 * The default font covers Latin only. A name in Sinhala or Tamil needs that
 * script's font, fetched from Google Fonts with just the name's characters
 * (served as TrueType, which the renderer reads). Without it the name would
 * come out as empty boxes, so a failure is logged, not hidden.
 */
async function scriptFont(family: string, text: string) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@700&text=${encodeURIComponent(text)}`
    ).then((response) => response.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) throw new Error("no TrueType font in the stylesheet");

    const data = await fetch(url).then((response) => response.arrayBuffer());
    return { name: family, data, weight: 700 as const, style: "normal" as const };
  } catch (error) {
    console.error(`Certificate font error (${family}):`, error);
    return null;
  }
}

const day = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

/** The certificate as a 1200x630 PNG: the download, and the link preview */
export async function renderCertificateImage(
  cert: PublicCertificate,
  verifyUrl: string,
  headers: Record<string, string> = {}
): Promise<ImageResponse> {
  const track = getTrack(cert.track)!;
  const [light, dark] = track.colors;

  const fonts = (
    await Promise.all([
      SINHALA.test(cert.name) ? scriptFont("Noto Sans Sinhala", cert.name) : null,
      TAMIL.test(cert.name) ? scriptFont("Noto Sans Tamil", cert.name) : null,
    ])
  ).filter((font) => font !== null);

  const stamp =
    cert.state === "expired" ? "EXPIRED" : cert.state === "revoked" ? "NO LONGER VALID" : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fbfaf6",
          fontFamily: "Noto Sans, Noto Sans Sinhala, Noto Sans Tamil",
          position: "relative",
        }}
      >
        {/* Side band in the path's colours, with the badge */}
        <div
          style={{
            width: 380,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(160deg, ${light}, ${dark})`,
          }}
        >
          <svg width="260" height="290" viewBox="0 0 240 290">
            <polygon points={rosette(120, 116, 96, 88, 24)} fill="#ffffff" fillOpacity="0.95" />
            <circle cx="120" cy="116" r="76" fill={dark} />
            <circle cx="120" cy="116" r="68" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
            <g transform="translate(88 82) scale(1)">
              <path d={LEAF} fill="#ffffff" />
            </g>
            <rect x="40" y="220" width="160" height="44" rx="22" fill="#ffffff" />
            <text
              x="120"
              y="250"
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill={dark}
            >
              {track.badgeLabel.toUpperCase()}
            </text>
          </svg>
        </div>

        {/* The certificate itself */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px 64px",
            color: "#111827",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 6, color: dark }}>
            ASWEDDUMA CERTIFIED
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 10 }}>{track.name.en}</div>
          <div style={{ fontSize: 22, color: "#6b7280", marginTop: 44 }}>Awarded to</div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, marginTop: 6 }}>{cert.name}</div>
          <div style={{ display: "flex", gap: 48, marginTop: 44, fontSize: 22 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#6b7280", fontSize: 18 }}>Issued</span>
              <span style={{ fontWeight: 700 }}>{day(cert.issuedAt)}</span>
            </div>
            {cert.expiresAt && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#6b7280", fontSize: 18 }}>Valid until</span>
                <span style={{ fontWeight: 700 }}>{day(cert.expiresAt)}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#6b7280", fontSize: 18 }}>Certificate ID</span>
              <span style={{ fontWeight: 700 }}>{cert.code}</span>
            </div>
          </div>
          <div style={{ fontSize: 18, color: "#6b7280", marginTop: 36 }}>Verify at {verifyUrl}</div>
        </div>

        {stamp && (
          <div
            style={{
              position: "absolute",
              top: 250,
              left: 420,
              display: "flex",
              padding: "12px 32px",
              border: "6px solid #b91c1c",
              borderRadius: 16,
              color: "#b91c1c",
              fontSize: 56,
              fontWeight: 700,
              transform: "rotate(-12deg)",
              background: "rgba(255,255,255,0.85)",
            }}
          >
            {stamp}
          </div>
        )}
      </div>
    ),
    { ...CERTIFICATE_IMAGE_SIZE, fonts, headers }
  );
}
