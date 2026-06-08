/**
 * Stored values of the `PpPkgType` choice field on the hub "Maloppsett"
 * (Template Options) list. These are stable Norwegian literals (kept identical
 * across locales) so consumers can compare against them directly.
 *
 * The writer side (PortfolioExtensions) has its own value-compatible `PpPkgType`
 * enum; shared-library deliberately does not depend on that SPFx package, so the
 * literals are duplicated here as a const map.
 */
export const PP_PKG_TYPE = {
  /** Local template authored in the installation (default). */
  Lokal: 'Lokal',
  /** Imported from the catalog (Mode A) — hub content provisioned locally. */
  Importert: 'Importert',
  /** Central "skymal" (Mode B) — metadata-only shadow, resolved at runtime. */
  Sentral: 'Sentral'
} as const

export type PpPkgTypeValue = (typeof PP_PKG_TYPE)[keyof typeof PP_PKG_TYPE]
