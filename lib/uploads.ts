/** A file type the app accepts, recognised by its first bytes */
type FileKind = {
  type: string;
  ext: string;
  matches: (bytes: Uint8Array) => boolean;
};

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

export const IMAGE_KINDS: FileKind[] = [
  { type: "image/jpeg", ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    ext: "png",
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/webp",
    ext: "webp",
    matches: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  },
];

export const PDF_KIND: FileKind = {
  type: "application/pdf",
  ext: "pdf",
  matches: (b) => ascii(b, 0, 5) === "%PDF-",
};

export type UploadError = "empty" | "tooLarge" | "type";

/**
 * Checks an upload by its first bytes, not the type the browser claims: a
 * renamed file of any other kind (an SVG or HTML page, say) is refused.
 */
export function checkUpload(
  bytes: Uint8Array,
  { maxBytes, kinds }: { maxBytes: number; kinds: FileKind[] }
): { type: string; ext: string; error?: never } | { error: UploadError } {
  if (bytes.length === 0) return { error: "empty" };
  if (bytes.length > maxBytes) return { error: "tooLarge" };

  const kind = kinds.find((candidate) => candidate.matches(bytes));
  if (!kind) return { error: "type" };

  return { type: kind.type, ext: kind.ext };
}

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** A bank transfer slip: a photo or a PDF, up to 5 MB */
export function checkReceipt(bytes: Uint8Array) {
  return checkUpload(bytes, { maxBytes: MAX_RECEIPT_BYTES, kinds: [...IMAGE_KINDS, PDF_KIND] });
}
