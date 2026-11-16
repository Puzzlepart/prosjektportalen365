import { mergeClasses } from '@fluentui/react-components'
import { getStatusTile, IStatusTile } from 'pp365-shared-library'
import { CSSProperties } from 'react'
import styles from './StatusTile.module.scss'
import { IStatusTileProps } from './types'

/** The tile's two colours as the custom properties its stylesheet reads. */
function getTileStyle(tile?: IStatusTile): CSSProperties | undefined {
  if (!tile) return undefined
  return { '--fill': tile.fill, '--ink': tile.ink } as CSSProperties
}

/**
 * Component logic hook for `StatusTile`: a light tone of the value's colour with the shape in a
 * dark tone of it, a neutral tile where the colour cannot be read or there is none, and a dashed
 * one without a value.
 */
export function useStatusTile(props: IStatusTileProps) {
  if (props.shape.shape === 'empty') return { className: mergeClasses(styles.root, styles.empty) }
  const tile = getStatusTile(props.color)
  return {
    className: mergeClasses(styles.root, !tile && styles.neutral),
    style: getTileStyle(tile)
  }
}
