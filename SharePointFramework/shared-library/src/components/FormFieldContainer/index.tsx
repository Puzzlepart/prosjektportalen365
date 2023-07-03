import React, { FC } from 'react'
import styles from './FormFieldContainer.module.scss'
import { IFormFieldContainerProps } from './types'


export const FormFieldContainer: FC<IFormFieldContainerProps> = (props) => {
    return (
        <div className={styles.root}>
            {props.children}
            {props.description && (
                <div className={styles.description}>
                    {props.description}
                </div>
            )}
        </div>
    )
}