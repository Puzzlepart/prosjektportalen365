import React, { FC } from 'react'
import styles from './FormFieldContainer.module.scss'
import { IFormFieldContainerProps } from './types'
import _ from 'lodash'

export const FormFieldContainer: FC<IFormFieldContainerProps> = (props) => {
  return (
    <div className={styles.root} {..._.omit(props, 'description')}>
      {props.children}
      {props.description && <div className={styles.description}>{props.description}</div>}
    </div>
  )
}
