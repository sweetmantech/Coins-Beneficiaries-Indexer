function extractUrlsFromHexInput(input: string): string[] {
  const rawHex = (input.startsWith("0x") ? input.slice(2) : input).toLowerCase();
  if (!/^[0-9a-f]*$/.test(rawHex) || rawHex.length < 2) return [];

  const urlPrefixHex = "68747470733a2f2f"; // "https://"
  const urls: string[] = [];

  for (
    let start = rawHex.indexOf(urlPrefixHex);
    start !== -1;
    start = rawHex.indexOf(urlPrefixHex, start + 2)
  ) {
    let end = start;
    while (end + 2 <= rawHex.length) {
      if (rawHex.slice(end, end + 2) === "00") break;
      end += 2;
    }

    const urlHex = rawHex.slice(start, end);
    if (urlHex.length === 0 || urlHex.length % 2 !== 0) continue;

    let decoded = "";
    for (let i = 0; i < urlHex.length; i += 2) {
      const byteValue = Number.parseInt(urlHex.slice(i, i + 2), 16);
      decoded += String.fromCharCode(byteValue);
    }

    if (decoded.startsWith("https://")) urls.push(decoded);
  }

  return urls;
}

export default extractUrlsFromHexInput;
