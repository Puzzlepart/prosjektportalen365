import React, { FC } from 'react'
import styles from './FieldContainer.module.scss'
import { IFieldContainerProps } from './types'
import { Field } from '@fluentui/react-components'
import { IconLabel } from './IconLabel'

export const FieldContainer: FC<IFieldContainerProps> = (props) => {
  let label = props.label
  if (props.iconName) {
    label = {
      children: () => <IconLabel {...props} />
    }
  }
  return (
    <div className={styles.fieldContainer} hidden={props.hidden}>
      <Field
        className={styles.field}
        label={label}
        required={props.required}
        hint={props.description ?? props.hint}
        validationState={props.validationState}
        validationMessage={props.validationMessage}
      >
        {props.children}
      </Field>
    </div>
  )
}
