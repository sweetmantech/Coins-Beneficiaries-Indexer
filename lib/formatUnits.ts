const formatUnits = (value: bigint, decimals: number): string => {
  if (decimals === 0) return value.toString();
  const s = value.toString();
  if (s.length <= decimals) {
    const padded = s.padStart(decimals, "0");
    return `0.${padded}`;
  }
  const i = s.length - decimals;
  return `${s.slice(0, i)}.${s.slice(i)}`;
};

export default formatUnits;
