import React, { FC } from 'react'
import styles from './MatrixHeaderCell.module.scss'
import { IMatrixHeaderCellProps } from './types'
import { Text } from '@fluentui/react-components'

export const MatrixHeaderCell: FC<IMatrixHeaderCellProps> = (props) => {
  return (
    <div className={styles.matrixHeaderCell}>
      <div className={styles.headerCell}>
        <Text weight='semibold'>{props.text}</Text>
      </div>
    </div>
  )
}

MatrixHeaderCell.defaultProps = {
  text: ''
}

export * from './types'
