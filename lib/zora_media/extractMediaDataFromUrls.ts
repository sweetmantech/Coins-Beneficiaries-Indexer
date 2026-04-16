import type { ZoraMediaUris } from "@/lib/consts";
import normalizeDecodedMediaData from "@/lib/zora_media/normalizeDecodedMediaData";

function extractMediaDataFromUrls(urls: string[]): ZoraMediaUris | undefined {
  const metadataURI = urls.find((url) => /metadata|\.json($|\?)/i.test(url));
  const tokenURI = urls.find((url) => url !== metadataURI);

  if (!tokenURI || !metadataURI) return undefined;
  return normalizeDecodedMediaData({ tokenURI, metadataURI });
}

export default extractMediaDataFromUrls;
