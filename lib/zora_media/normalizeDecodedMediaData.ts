import type { ZoraMediaUris } from "@/lib/consts";

function normalizeDecodedMediaData(data: ZoraMediaUris | undefined): ZoraMediaUris | undefined {
  if (!data) return undefined;
  if (typeof data.tokenURI !== "string" || typeof data.metadataURI !== "string") return undefined;
  if (data.tokenURI.includes("\u0000") || data.metadataURI.includes("\u0000")) return undefined;

  const tokenURI = data.tokenURI.trim();
  const metadataURI = data.metadataURI.trim();
  if (!tokenURI || !metadataURI) return undefined;

  return { tokenURI, metadataURI };
}

export default normalizeDecodedMediaData;
