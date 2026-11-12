import { iconCatalog } from './iconCatalog'

/**
 * Represents the name of a Fluent UI icon.
 */

export type FluentIconName = keyof typeof iconCatalog

/**
 * The result of resolving an arbitrary icon name (catalog key or legacy
 * UI Fabric alias) to a canonical catalog entry.
 */
export type ResolvedFluentIcon = {
  name: FluentIconName

  /**
   * Whether the alias implies the filled variant (e.g. `CircleFill`).
   */
  filled?: boolean
}

/**
 * Target of a legacy UI Fabric icon name alias. Either a bare catalog name,
 * or a catalog name together with a `filled` hint.
 */
export type FabricIconAlias = FluentIconName | { name: FluentIconName; filled?: boolean }

/**
 * Options for getting a Fluent icon.
 */
export type GetFluentIconOptions = {
  /**
   * Uses a cached filled/regular bundle by default; false selects one variant directly.
   */
  bundle?: boolean

  color?: string

  size?: string | number

  filled?: boolean

  /**
   * Returns an element by default; false returns the icon component instead.
   */
  jsx?: boolean

  className?: string
}

/**
 * Options for `getFluentIconWithFallback`. Applies to both the Fluent branch
 * and the UI Fabric fallback branch, so callers do not need to know which one
 * rendered.
 */
export type GetFluentIconWithFallbackOptions = Pick<
  GetFluentIconOptions,
  'bundle' | 'color' | 'size' | 'filled' | 'className'
>
