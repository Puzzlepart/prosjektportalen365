import React, { FC, useContext } from 'react'
import { DynamicMatrixContext } from './context'
import styles from './DynamicMatrix.module.scss'
import { MatrixCell, MatrixCellType, MatrixElement, MatrixHeaderCell } from './MatrixCell'
import { MatrixRow } from './MatrixRow'

export const DynamicMatrix: FC = () => {
  const context = useContext(DynamicMatrixContext)

  return (
    <div className={styles.root} style={{ width: context.width, minHeight: 300 }}>
      {context.configuration.map((rows, i) => {
        const cells = rows.map((c, j) => {
          const cell = context.configuration[i][j]
          const elements = context.getElementsForCell(cell)
          switch (cell.cellType) {
            case MatrixCellType.Cell: {
              return (
                <MatrixCell key={j} className={cell.className} cell={cell}>
                  {elements.map((props, idx) => (
                    <MatrixElement key={idx} {...props} />
                  ))}
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
      })}
    </div>
  )
}

export * from './MatrixCell'
export * from './MatrixRow'
export * from './context'
export * from './types'
