import React, { FC } from 'react'
import styles from './MatrixHeaderCell.module.scss'
import { IMatrixHeaderCellProps } from './types'
import { Text } from '@fluentui/react-components'
import { withDefaults } from 'pp365-shared-library'

const MATRIX_HEADER_CELL_DEFAULT_PROPS: Partial<IMatrixHeaderCellProps> = {
  text: ''
}

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, MATRIX_HEADER_CELL_DEFAULT_PROPS)
  return (
    <div className={styles.matrixHeaderCell} role={props.role}>
      <div className={styles.headerCell}>
        <Text weight='semibold'>{props.text}</Text>
      </div>
    </div>
  )
}

export * from './types'
