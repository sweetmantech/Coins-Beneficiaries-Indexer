function decodeHexRun(rawHex: string, start: number, asciiPrefix: string): string | undefined {
  let end = start;
  while (end + 2 <= rawHex.length) {
    if (rawHex.slice(end, end + 2) === "00") break;
    end += 2;
  }

  const urlHex = rawHex.slice(start, end);
  if (urlHex.length === 0 || urlHex.length % 2 !== 0) return undefined;

  let decoded = "";
  for (let i = 0; i < urlHex.length; i += 2) {
    const byteValue = Number.parseInt(urlHex.slice(i, i + 2), 16);
    decoded += String.fromCharCode(byteValue);
  }

  return decoded.startsWith(asciiPrefix) ? decoded : undefined;
}

export default decodeHexRun;
