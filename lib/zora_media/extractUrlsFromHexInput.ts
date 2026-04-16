import decodeHexRun from "@/lib/zora_media/decodeHexRun";
import { URL_PREFIXES_HEX } from "@/lib/consts";

function extractUrlsFromHexInput(input: string): string[] {
  const rawHex = (input.startsWith("0x") ? input.slice(2) : input).toLowerCase();
  if (!/^[0-9a-f]*$/.test(rawHex) || rawHex.length < 2) return [];

  const spans: { start: number; url: string }[] = [];

  for (const [prefixHex, asciiPrefix] of URL_PREFIXES_HEX) {
    for (
      let start = rawHex.indexOf(prefixHex);
      start !== -1;
      start = rawHex.indexOf(prefixHex, start + 2)
    ) {
      const decoded = decodeHexRun(rawHex, start, asciiPrefix);
      if (decoded) spans.push({ start, url: decoded });
    }
  }

  spans.sort((a, b) => a.start - b.start);

  return spans.map((s) => s.url);
}

export default extractUrlsFromHexInput;
