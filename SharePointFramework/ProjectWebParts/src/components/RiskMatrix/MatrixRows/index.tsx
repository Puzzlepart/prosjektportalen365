import { getId } from '@fluentui/react'
import { Toggle } from '@fluentui/react/lib/Toggle'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useState } from 'react'
import { RiskMatrixContext } from '../context'
import { IMatrixCell, MatrixCell, MatrixCellType, MatrixHeaderCell } from '../MatrixCell'
import { RiskElement } from '../RiskElement'
import { MatrixRow } from './MatrixRow'

export const MatrixRows: FC = () => {
  const context = useContext(RiskMatrixContext)
  const [showPostAction, setShowPostAction] = useState(false)

  /**
   * Get risk elements for cell
   *
   * @param cell Cell
   */
  const getRiskElementsForCell = (cell: IMatrixCell) => {
    const itemsForCell = context.items.filter(
      ({ probability, consequence }) =>
        cell.probability === probability && cell.consequence === consequence
    )
    return itemsForCell.map((risk, idx) => <RiskElement key={getId(idx.toString())} model={risk} />)
  }

  /**
   * Get risk elements post action for cell
   *
   * @param cell Cell
   */
  const getRiskElementsPostActionForCell = (cell: IMatrixCell) => {
    const itemsForCell = context.items.filter(
      ({ probabilityPostAction, consequencePostAction }) =>
        cell.probability === probabilityPostAction && cell.consequence === consequencePostAction
    )
    return itemsForCell.map((risk, idx) => <RiskElement key={getId(idx.toString())} model={risk} />)
  }

  const children = context.configuration.map((rows, i) => {
    const cells = rows.map((c, j) => {
      const cell = context.configuration[i][j]
      const riskElements = getRiskElementsForCell(cell)
      const riskElementsPostAction = getRiskElementsPostActionForCell(cell)
      switch (cell.cellType) {
        case MatrixCellType.Cell: {
          return (
            <MatrixCell key={j} className={cell.className} cell={cell} >
              <span hidden={showPostAction}>{riskElements}</span>
              <span hidden={!showPostAction}>{riskElementsPostAction}</span>
            </MatrixCell>
          )
        }
        case MatrixCellType.Header: {
          return <MatrixHeaderCell key={j} text={c.cellValue} className={cell.className} />
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
