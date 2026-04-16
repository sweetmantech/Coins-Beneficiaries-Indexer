import type { ZoraMediaUris } from "@/lib/consts";
import dedupePreserveOrder from "@/lib/zora_media/dedupePreserveOrder";
import normalizeDecodedMediaData from "@/lib/zora_media/normalizeDecodedMediaData";

function extractMediaDataFromUrls(urls: string[]): ZoraMediaUris | undefined {
  const unique = dedupePreserveOrder(urls);
  if (unique.length < 2) return undefined;

  let metadataURI = unique.find((url) => /metadata|\.json($|\?)/i.test(url));
  let tokenURI = unique.find((url) => url !== metadataURI);

  if (!metadataURI || !tokenURI) {
    // Raw IPFS (or other) CIDs in calldata have no path hint; ABI order is tokenURI then metadataURI.
    tokenURI = unique[0];
    metadataURI = unique[1];
  }

  if (!tokenURI || !metadataURI) return undefined;
  return normalizeDecodedMediaData({ tokenURI, metadataURI });
}

export default extractMediaDataFromUrls;
