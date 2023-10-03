import { iconCatalog } from './iconCatalog'

/**
 * Represents the name of a Fluent UI icon.
 */

export type FluentIconName = keyof typeof iconCatalog

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
}
