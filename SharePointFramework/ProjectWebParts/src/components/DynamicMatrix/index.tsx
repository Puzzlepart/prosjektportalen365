import React, { FC } from 'react'
import { DynamicMatrixContext } from './context'
import styles from './DynamicMatrix.module.scss'
import { MatrixCell, MatrixCellType, MatrixElement, MatrixHeaderCell } from './MatrixCell'
import { MatrixRow } from './MatrixRow'
import { IDynamicMatrixProps } from './types'

export const DynamicMatrix: FC<IDynamicMatrixProps> = (props) => {
  return (
    <DynamicMatrixContext.Provider value={{ props }}>
      <div className={styles.root} style={{ width: props.width, minHeight: 300 }}>
        {props.configuration.map((rows, i) => {
          const cells = rows.map((c, j) => {
            const cell = props.configuration[i][j]
            const elements = props.getElementsForCell(cell)
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
    </DynamicMatrixContext.Provider>
  )
}

export * from './context'
export * from './MatrixCell'
export * from './MatrixRow'
export * from './types'
