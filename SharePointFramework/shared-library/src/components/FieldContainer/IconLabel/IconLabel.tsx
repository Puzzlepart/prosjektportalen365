import { Label, LabelProps } from '@fluentui/react-components'
import React, { FC } from 'react'
import { getFluentIcon } from '../../../icons'
import { IFieldContainerProps } from '../types'
import styles from './IconLabel.module.scss'

export interface IIconLabelProps extends IFieldContainerProps {
  /**
   * The props Fluent's `Field` gives its label. Only the id and `for` are used, which tie the label
   * to the field's control; the field's own label styles are left out, so the look stays.
   */
  labelProps?: LabelProps
}

export const IconLabel: FC<IIconLabelProps> = ({ labelProps, ...props }) => {
  return (
    // The icon is inside the label, so a click on it, as on the text, goes to the field.
    <Label
      id={labelProps?.id}
      htmlFor={labelProps?.htmlFor}
      size='small'
      weight='semibold'
      required={props.required}
      className={styles.iconLabel}
    >
      {getFluentIcon(props.iconName)}
      {props.label as React.ReactNode}
    </Label>
  )
}
