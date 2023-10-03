import React, { FC } from 'react'
import { Field, Text } from '@fluentui/react-components'
import styles from './IconField.module.scss'
import { IIconFieldProps } from './types'

export const IconField: FC<IIconFieldProps> = (props) => {
  return (
    <Field
      label={{
        children: () => {
          const Icon = props.icon
          return (
            <div className={styles.iconLabel}>
              {Icon && <Icon />}
              <Text size={200} weight='semibold'>
                {props.label}
              </Text>
            </div>
          )
        }
      }}
      hint={props.hint}
    >
      {props.children}
    </Field>
  )
}
