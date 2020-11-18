import { tryParseInt } from './'

export function tryParseCurrency(str: string, fallback: string): number | string {
  const parsed = tryParseInt(str, fallback)
  if (parsed === fallback) {
    return fallback
  }
  return `kr ${parsed as number}`
}
