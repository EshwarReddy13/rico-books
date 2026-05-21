export function paiseToNumber(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) {
    throw new RangeError("Amount exceeds safe integer range");
  }
  return n;
}
