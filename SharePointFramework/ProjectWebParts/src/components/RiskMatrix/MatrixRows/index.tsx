import { getId } from '@fluentui/react'
import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { IMatrixCell, MatrixCell, MatrixCellType, MatrixHeaderCell } from '../MatrixCell'
import { RiskElement } from '../RiskElement'
import RISK_MATRIX_CELLS from '../RiskMatrixCells'
import { MatrixRow } from './MatrixRow'
import { IMatrixRowsProps } from './types'

/**
 * Get risk elements for cell
 * 
 * @param cell Cell
 * @param props Props for MatrixRows
 */
const getRiskElementsForCell = (
  cell: IMatrixCell,
  props: IMatrixRowsProps
) => {
  const itemsForCell = props.items.filter(
    ({ probability, consequence }) => cell.probability === probability && cell.consequence === consequence
  )
  return itemsForCell.map((risk, idx) => (
    <RiskElement key={getId(idx.toString())} model={risk} calloutTemplate={props.calloutTemplate} />
  ))
}

/**
 * Get risk elements post action for cell
 * 
 * @param cell Cell
 * @param props Props for MatrixRows
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRiskElementsPostActionForCell = (
  cell: IMatrixCell,
  props: IMatrixRowsProps
) => {
  const itemsForCell = props.items.filter(
    (risk) =>
      cell.probability === risk.probabilityPostAction &&
      cell.consequence === risk.consequencePostAction
  )
  return itemsForCell.map((risk, idx) => (
    <RiskElement
      key={getId(idx.toString())}
      model={risk}
      calloutTemplate={props.calloutTemplate}
    />
  ))
}

export const MatrixRows: FC<IMatrixRowsProps> = (props) => {
  const [showPostAction, setShowPostAction] = useState(false)

  const children = props.cells.map((rows, i) => {
    const cells = rows.map((c, j) => {
      const cell = props.cells[i][j]
      const riskElements = getRiskElementsForCell(cell, props)
      const riskElementsPostAction = getRiskElementsPostActionForCell(
        cell,
        props
      )
      switch (cell.cellType) {
        case MatrixCellType.Cell: {
          return (
            <MatrixCell key={j} style={cell.style} className={cell.className}>
              <span hidden={showPostAction}>{riskElements}</span>
              <span hidden={!showPostAction}>{riskElementsPostAction}</span>
            </MatrixCell>
          )
        }
        case MatrixCellType.Header: {
          return <MatrixHeaderCell key={j} label={c.cellValue} className={cell.className} />
        }
        default:
          return null
      }
    })
    return <MatrixRow key={i}>{cells}</MatrixRow>
  })
  return (
    <>
      {children}
      <Toggle
        label={strings.RiskMatrix_ToggleElements}
        onText={strings.Yes}
        offText={strings.No}
        onChange={(_event, checked) => setShowPostAction(checked)}
      />
    </>
  )
}

MatrixRows.defaultProps = {
  cells: RISK_MATRIX_CELLS
}