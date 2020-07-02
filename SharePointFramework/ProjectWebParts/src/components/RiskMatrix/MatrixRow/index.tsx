import * as React from 'react'
import { IMatrixCell } from '../IMatrixCell'
import { MatrixCell, MatrixCellType, MatrixHeaderCell } from '../MatrixCell'
import { RiskElement } from '../RiskElement'
import { RiskElementModel } from '../RiskElementModel'
import RISK_MATRIX_CELLS from '../RiskMatrixCells'
import { IMatrixRowProps } from './IMatrixRowProps'
import styles from './MatrixRow.module.scss'


export const MatrixRow = ({ children }: IMatrixRowProps) => {
    return (
        <tr className={styles.matrixRow}>
            {children}
        </tr>
    )
}

/**
 * Get risk elements for cell 
 */
const getRiskElementsForCell = (items: RiskElementModel[], cell: IMatrixCell, calloutTemplate: string) => {
    const itemsForCell = items.filter(risk => cell.probability === risk.probability && cell.consequence === risk.consequence)
    const riskElements = itemsForCell.map((risk, idx) => <RiskElement key={idx} model={risk} calloutTemplate={calloutTemplate} />)
    return riskElements
}

/**
 * Get risk elements post action for cell
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRiskElementsPostActionForCell = (_items: RiskElementModel[], _cell: IMatrixCell, _calloutTemplate: string) => {
    return []
}


export const MatrixRows = ({ items, calloutTemplate }) => {
    const children = RISK_MATRIX_CELLS.map((rows, i) => {
        const cells = rows.map((c, j) => {
            const cell = RISK_MATRIX_CELLS[i][j]
            const riskElements = getRiskElementsForCell(items, cell, calloutTemplate)
            const riskElementsPostAction = getRiskElementsPostActionForCell(items, cell, calloutTemplate)
            switch (cell.cellType) {
                case MatrixCellType.Cell: {
                    return (
                        <MatrixCell
                            key={`MatrixCell_${j}`}
                            style={cell.style}
                            className={cell.className}>
                            {riskElements}
                            {riskElementsPostAction}
                        </MatrixCell>
                    )
                }
                case MatrixCellType.Header: {
                    return (
                        <MatrixHeaderCell
                            key={`MatrixHeaderCell_${j}`}
                            label={c.cellValue}
                            className={cell.className} />
                    )
                }
                default: return null
            }
        })
        return (
            <MatrixRow key={i}>
                {cells}
            </MatrixRow>
        )
    })
    return (
        <>
            {children}
        </>
    )
}