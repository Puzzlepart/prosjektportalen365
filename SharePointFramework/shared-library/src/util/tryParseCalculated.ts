/**
 * Extracts the value from SharePoint calculated column format (e.g., 'float;#2.5' -> '2.5')
 * @param str The raw calculated column value
 * @param fallback The fallback value to return if extraction fails
 * @returns The extracted value or the fallback value if extraction fails
 */
export function tryParseCalculated(str: string | null | undefined, fallback: string): string {
  if (typeof str !== 'string' || !str) return fallback
  const [, value] = str.split(';#')
  return value ?? str ?? fallback
}
