import { StatusShape } from '../../util/statusMark'

/**
 * Configures the shape drawn for a status value.
 */
export interface IStatusGlyphProps {
  /**
   * The shape to draw (`getStatusShapes`): `'icon'` for the value's own icon, `'unknown'` for a
   * value the configuration does not know, `'empty'` for no value.
   */
  shape: StatusShape

  /**
   * The status value's own icon (`GtPortfolioColumnIconName` in `Prosjektkolonnekonfigurasjon`),
   * drawn when `shape` is `'icon'`.
   */
  iconName?: string

  /**
   * A class for the glyph's root, beside its own.
   */
  className?: string
}
