import React, { FC } from 'react'
import { IStatusGlyphProps } from './types'
import { useStatusGlyph } from './useStatusGlyph'

/**
 * A status value's shape, 12 px in the text colour of what holds it (a status tile's ink), so a
 * status is told by more than its colour (WCAG 1.4.1): a check, a warning, a cross or one of their
 * variants, a dot, square, diamond, triangle or ring, the value's own icon, «?» for a value the
 * configuration does not know, or a dash for no value. The shapes drawn in CSS are borders, which
 * a Windows contrast theme keeps where it takes every background away. Hidden from screen
 * readers: what holds it names the status.
 */
export const StatusGlyph: FC<IStatusGlyphProps> = (props) => {
  const { className, Glyph, ownIcon, shapeClassName, text } = useStatusGlyph(props)
  return (
    <span className={className} aria-hidden='true' data-status-glyph={props.shape}>
      {Glyph && <Glyph />}
      {ownIcon}
      {shapeClassName && <span className={shapeClassName}>{text}</span>}
    </span>
  )
}

StatusGlyph.displayName = 'StatusGlyph'
