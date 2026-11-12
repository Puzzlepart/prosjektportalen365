/**
 * Replace tokens in a template string with values from an object. Tokens are
 * in the form of {{ token }}.
 */
export function t9r(template: string, interpolations: Record<string, any>): string {
  return template.replace(/\{\{\s*([^}\s]+)\s*\}\}/g, (_, token) => interpolations[token])
}
