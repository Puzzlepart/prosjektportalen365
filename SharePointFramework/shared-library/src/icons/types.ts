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
  /**
   * The canonical catalog name of the icon.
   */
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
   * Whether to bundle the icon or not.
   */
  bundle?: boolean

  /**
   * The color of the icon.
   */
  color?: string

  /**
   * The size of the icon.
   */
  size?: string | number

  /**
   * Whether the icon should be filled or not.
   */
  filled?: boolean

  /**
   * Whether to return the icon as a JSX element or not.
   */
  jsx?: boolean

  /**
   * Class name to apply to the rendered icon element.
   */
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
