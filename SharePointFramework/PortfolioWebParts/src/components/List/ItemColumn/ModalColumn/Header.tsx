import { stringIsNullOrEmpty } from '@pnp/core'
import React, { FC } from 'react'
import styles from './ModalColumn.module.scss'
import { IModalColumnProps } from './types'

export const Header: FC<IModalColumnProps> = ({
  item,
  headerTitleField,
  headerSubTitleField
}: IModalColumnProps) => {
  const title = item[headerTitleField]
  const subTitle = item[headerSubTitleField]
  return (
    <div className={styles.header} hidden={stringIsNullOrEmpty(title)}>
      <div className={styles.title}>{title}</div>
      <div className={styles.subTitle}>{subTitle}</div>
    </div>
  )
}
