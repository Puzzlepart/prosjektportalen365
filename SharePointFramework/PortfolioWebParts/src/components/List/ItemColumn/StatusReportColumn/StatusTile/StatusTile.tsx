import { StatusGlyph } from 'pp365-shared-library'
import React, { FC } from 'react'
import { IStatusTileProps } from './types'
import { useStatusTile } from './useStatusTile'

/**
 * A status section's value as a 20 px tile: its shape in a dark tone of the value's colour on a
 * light tone of it, which hold 4.5:1 against each other whatever the row behind them (WCAG 1.4.1,
 * 1.4.11). Hidden from screen readers: the strip's name and description, or the details' text
 * beside it, say the same.
 */
export const StatusTile: FC<IStatusTileProps> = (props) => {
  const { className, style } = useStatusTile(props)
  return (
    <span className={className} style={style} aria-hidden>
      <StatusGlyph shape={props.shape.shape} iconName={props.shape.iconName} />
    </span>
  )
}
