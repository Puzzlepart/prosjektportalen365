/**
 * Derives the site alias from a display name using the same rules as the
 * submitted provisioning request: spaces and illegal characters are stripped,
 * and the value is truncated so the full alias (including the naming
 * convention prefix/suffix) stays within the 64 character group alias limit.
 *
 * @param name Display name to derive the alias from
 * @param namingConvention Naming convention with optional `prefixText`/`suffixText`
 */
export function calculateAliasValue(
  name: string,
  namingConvention?: { prefixText?: string; suffixText?: string }
): string {
  const prefixLength = namingConvention?.prefixText?.length || 0
  const suffixLength = namingConvention?.suffixText?.length || 0
  const maxAliasLength = 64 - prefixLength - suffixLength

  const cleanedValue = name.replace(/ /g, '').replace(/[^a-z-A-Z0-9-]/g, '')
  return cleanedValue.substring(0, Math.max(1, maxAliasLength))
}
