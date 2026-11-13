import { format } from 'pp365-shared-library/lib/util'
import strings from 'ProjectWebPartsStrings'
import { IMatrixCell, MatrixCellType } from './MatrixCell/types'
import { DynamicMatrixConfiguration } from './types'

/** The key a cell's zone is kept under: its place in the matrix. */
export const getZoneKey = (cell: IMatrixCell): string => `${cell.x},${cell.y}`

/** A cell's zone in text. */
export interface IMatrixZone {
  /** The zone's name, read by screen readers and shown in the cell's tooltip («Nivå 3 av 4»). */
  name: string

  /** What the cell shows of it, in a corner: the configured name, or the level («3»). */
  mark: string
}

/**
 * The zone of each cell of the matrix as text, so its risk or opportunity level is not told by the
 * cell's colour alone (WCAG 1.4.1). A cell's own `cellValue` in the configuration is its zone's
 * name where the configuration gives one. Otherwise the zones are the cells' colours, ranked by
 * the mean probability times consequence of their cells, so the configured matrices read «Nivå 1
 * av 4» (green) to «Nivå 4 av 4» (red) whatever colours they use.
 *
 * @param configuration The matrix's rows, headers and cells
 *
 * @returns The zone of each cell that has one, by `getZoneKey`
 */
export function getMatrixZones(
  configuration: DynamicMatrixConfiguration
): Map<string, IMatrixZone> {
  const cells = (configuration ?? [])
    .flat()
    .filter(
      (cell) => cell?.cellType === MatrixCellType.Cell && (cell.cellValue || cell.backgroundColor)
    )
  const scores = new Map<string, number[]>()
  for (const cell of cells) {
    if (!cell.backgroundColor) continue
    const color = cell.backgroundColor.trim().toLowerCase()
    scores.set(color, [...(scores.get(color) ?? []), (cell.x ?? 0) * (cell.y ?? 0)])
  }
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const ranked = Array.from(scores.keys()).sort((a, b) => mean(scores.get(a)) - mean(scores.get(b)))
  const zones = new Map<string, IMatrixZone>()
  for (const cell of cells) {
    if (cell.cellValue) {
      zones.set(getZoneKey(cell), { name: cell.cellValue, mark: cell.cellValue })
      continue
    }
    const level = ranked.indexOf(cell.backgroundColor.trim().toLowerCase()) + 1
    zones.set(getZoneKey(cell), {
      name: format(strings.Aria.MatrixZoneLabel, level, ranked.length),
      mark: String(level)
    })
  }
  return zones
}
