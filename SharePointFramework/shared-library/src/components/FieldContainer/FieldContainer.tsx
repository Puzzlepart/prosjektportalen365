import React, { FC } from 'react'
import styles from './FieldContainer.module.scss'
import { IFieldContainerProps } from './types'
import { Field, LabelProps } from '@fluentui/react-components'
import { IconLabel } from './IconLabel'

export const FieldContainer: FC<IFieldContainerProps> = (props) => {
  let label = props.label
  if (props.iconName) {
    // Fluent hands the render function the label's props; the id and `for` in them are what tie
    // the label to the field's control (and give the control its accessible name).
    label = {
      children: (_: unknown, labelProps: LabelProps) => (
        <IconLabel {...props} labelProps={labelProps} />
      )
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
