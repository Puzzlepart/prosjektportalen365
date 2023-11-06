import React, { FC } from 'react'
import { DynamicMatrixContext } from './context'
import styles from './DynamicMatrix.module.scss'
import { MatrixCellType, MatrixElement, MatrixHeaderCell } from './MatrixCell'
import { MatrixCell } from './MatrixCell/MatrixCell'
import { MatrixRow } from './MatrixRow'
import { IDynamicMatrixProps } from './types'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'

export const DynamicMatrix: FC<IDynamicMatrixProps> = (props) => (
  <DynamicMatrixContext.Provider value={{ props }}>
    <FluentProvider theme={webLightTheme}>
      <div className={styles.dynamicMatrix} style={{ width: props.width }}>
        {props.configuration.map((row, rowIndex) => {
          const cells = row.map((cell, cellIndex) => {
            const elements = props.getElementsForCell(cell)
            switch (cell.cellType) {
              case MatrixCellType.Cell: {
                return (
                  <MatrixCell key={cellIndex} className={cell.className} cell={cell}>
                    {elements.map((props, idx) => (
                      <MatrixElement key={idx} {...props} />
                    ))}
                  </MatrixCell>
                )
              }
              case MatrixCellType.Header: {
                return (
                  <MatrixHeaderCell
                    key={cellIndex}
                    text={cell.cellValue}
                    className={cell.className}
                  />
                )
              }
            }
          })
          return <MatrixRow key={rowIndex}>{cells}</MatrixRow>
        })}
      </div>
    </FluentProvider>
  </DynamicMatrixContext.Provider>
)
