import React, { FC, useMemo } from 'react'
import { DynamicMatrixContext } from './context'
import styles from './DynamicMatrix.module.scss'
import { getMatrixZones, getZoneKey } from './getMatrixZones'
import { MatrixCellType, MatrixElement, MatrixHeaderCell } from './MatrixCell'
import { MatrixCell } from './MatrixCell/MatrixCell'
import { MatrixRow } from './MatrixRow'
import { IDynamicMatrixProps } from './types'
import { FluentProvider } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

/**
 * The matrix, drawn as a grid and read as a table (WCAG 1.3.1): the top row's headers are the
 * columns' (consequence), each row's first the row's (probability), so a screen reader tells where
 * an element sits. Each cell's zone is in text as well as in its colour (WCAG 1.4.1).
 */
export const DynamicMatrix: FC<IDynamicMatrixProps> = (props) => {
  const zones = useMemo(() => getMatrixZones(props.configuration), [props.configuration])
  return (
    <DynamicMatrixContext.Provider value={{ props }}>
      <FluentProvider theme={customLightTheme}>
        <div
          className={styles.dynamicMatrix}
          style={{ width: props.width }}
          role='table'
          aria-label={props.title}
        >
          {props.configuration.map((row, rowIndex) => {
            const cells = row.map((cell, cellIndex) => {
              const elements = props.getElementsForCell(cell)
              switch (cell.cellType) {
                case MatrixCellType.Cell: {
                  return (
                    <MatrixCell
                      key={cellIndex}
                      className={cell.className}
                      cell={cell}
                      zone={zones.get(getZoneKey(cell))}
                    >
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
                      role={rowIndex === 0 ? 'columnheader' : 'rowheader'}
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
}
