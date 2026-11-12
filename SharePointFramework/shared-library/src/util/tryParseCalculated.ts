/**
 * Extracts a calculated-column value after ;#, preserving plain text and using the fallback for absent input.
 */
export function tryParseCalculated(str: string | null | undefined, fallback: string): string {
  if (typeof str !== 'string' || !str) return fallback
  const [, value] = str.split(';#')
  return value ?? str ?? fallback
}
