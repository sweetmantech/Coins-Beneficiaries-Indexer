import type { ZoraMediaUris } from "@/lib/consts";

function normalizeDecodedMediaData(data: ZoraMediaUris | undefined): ZoraMediaUris | undefined {
  if (!data) return undefined;
  if (typeof data.tokenURI !== "string" || typeof data.metadataURI !== "string") return undefined;

  return { tokenURI: data.tokenURI, metadataURI: data.metadataURI };
}

export default normalizeDecodedMediaData;
