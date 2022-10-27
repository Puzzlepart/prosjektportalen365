import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { RiskElementModel } from '../'
import { IMatrixCell, MatrixCell, MatrixCellType, MatrixHeaderCell } from '../MatrixCell'
import { RiskElement } from '../RiskElement'
import RISK_MATRIX_CELLS from '../RiskMatrixCells'
import styles from './MatrixRow.module.scss'
import { IMatrixRowProps } from './types'

export const MatrixRow: FC<IMatrixRowProps> = ({ children }: IMatrixRowProps) => {
  return <tr className={styles.matrixRow}>{children}</tr>
}

/**
 * Get risk elements for cell
 */
const getRiskElementsForCell = (
  items: RiskElementModel[],
  cell: IMatrixCell,
  calloutTemplate: string
) => {
  const itemsForCell = items.filter(
    (risk) => cell.probability === risk.probability && cell.consequence === risk.consequence
  )
  const riskElements = itemsForCell.map((risk, idx) => (
    <RiskElement key={`RiskElement_${idx}`} model={risk} calloutTemplate={calloutTemplate} />
  ))
  return riskElements
}

/**
 * Get risk elements post action for cell
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRiskElementsPostActionForCell = (
  items: RiskElementModel[],
  cell: IMatrixCell,
  calloutTemplate: string
) => {
  const itemsForCell = items.filter(
    (risk) =>
      cell.probability === risk.probabilityPostAction &&
      cell.consequence === risk.consequencePostAction
  )
  const riskElements = itemsForCell.map((risk, idx) => (
    <RiskElement
      key={`RiskElement_${idx}_PostAction`}
      model={risk}
      calloutTemplate={calloutTemplate}
    />
  ))
  return riskElements
}

export const MatrixRows = ({ items, calloutTemplate, customCells }) => {
  const [showPostAction, setShowPostAction] = React.useState(false)

  const selectedCells = customCells ?? RISK_MATRIX_CELLS

  const children = selectedCells.map((rows, i) => {
    const cells = rows.map((c, j) => {
      const cell = selectedCells[i][j]
      const riskElements = getRiskElementsForCell(items, cell, calloutTemplate)
      const riskElementsPostAction = getRiskElementsPostActionForCell(items, cell, calloutTemplate)
      switch (cell.cellType) {
        case MatrixCellType.Cell: {
          return (
            <MatrixCell key={`MatrixCell_${j}`} style={cell.style} className={cell.className}>
              <span hidden={showPostAction}>{riskElements}</span>
              <span hidden={!showPostAction}>{riskElementsPostAction}</span>
            </MatrixCell>
          )
        }
        case MatrixCellType.Header: {
          return (
            <MatrixHeaderCell
              key={`MatrixHeaderCell_${j}`}
              label={c.cellValue}
              className={cell.className}
            />
          )
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
        onChange={(_event, _showPostAction) => setShowPostAction(_showPostAction)}
      />
    </>
  )
}
