export function tryParseFloat(
  str: string,
  fallback: string | number
): number | string {
  const parsed = parseFloat(str)
  return !isNaN(parsed) ? parsed : fallback
}
