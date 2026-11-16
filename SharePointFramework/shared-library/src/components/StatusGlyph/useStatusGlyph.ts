import {
  Checkmark12Filled,
  CheckmarkCircle12Filled,
  Dismiss12Filled,
  ErrorCircle12Filled,
  FluentIcon,
  Prohibited12Filled,
  Triangle12Filled,
  Warning12Filled
} from '@fluentui/react-icons'
import { getFluentIconWithFallback, GetFluentIconWithFallbackOptions } from '../../icons'
import { conditionalClassName } from '../../util/conditionalClassName'
import { StatusShape } from '../../util/statusMark'
import styles from './StatusGlyph.module.scss'
import { IStatusGlyphProps } from './types'

/**
 * The shapes Fluent draws as icons made for 12 px (the catalog's are drawn for 20 px and blur
 * there), filled in the text colour.
 */
const ICON_GLYPHS: Partial<Record<StatusShape, FluentIcon>> = {
  check: Checkmark12Filled,
  warning: Warning12Filled,
  cross: Dismiss12Filled,
  checkCircle: CheckmarkCircle12Filled,
  errorCircle: ErrorCircle12Filled,
  prohibited: Prohibited12Filled,
  triangle: Triangle12Filled
}

/** The shapes drawn in CSS, and the «?» of a value the configuration does not know. */
const CSS_GLYPHS: Partial<Record<StatusShape, string>> = {
  dot: styles.dot,
  square: styles.square,
  diamond: styles.diamond,
  ring: styles.ring,
  empty: styles.empty,
  unknown: styles.unknown
}

/** What a value the configuration does not know shows: no shape stands for it. */
const UNKNOWN_TEXT = '?'

/** A value's own icon: filled, 12 px, and with no colour of its own, so it takes the ink. */
const OWN_ICON: GetFluentIconWithFallbackOptions = { bundle: false, filled: true, size: 12 }

/**
 * Component logic hook for `StatusGlyph`: what draws the shape, a Fluent icon (`Glyph`), the
 * value's own icon (`ownIcon`), or a CSS shape (`shapeClassName`) with the text it holds.
 */
export function useStatusGlyph(props: IStatusGlyphProps) {
  const { shape, iconName } = props
  return {
    className: conditionalClassName([styles.statusGlyph, props.className]),
    Glyph: ICON_GLYPHS[shape],
    ownIcon: shape === 'icon' ? getFluentIconWithFallback(iconName, OWN_ICON) : undefined,
    shapeClassName: CSS_GLYPHS[shape],
    text: shape === 'unknown' ? UNKNOWN_TEXT : undefined
  } as const
}
