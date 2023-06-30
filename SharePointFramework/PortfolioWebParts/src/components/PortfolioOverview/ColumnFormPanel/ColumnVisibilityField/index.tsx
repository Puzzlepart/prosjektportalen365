import { Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useState } from 'react'
import styles from '../ColumnFormPanel.module.scss'
import { visibilityOptions } from '../types'
import { IColumnVisibilityFieldProps } from './types'

export const ColumnVisibilityField: FC<IColumnVisibilityFieldProps> = (props) => {
  const [selection, setSelection] = useState<string[]>([])
  return (
    <div className={styles.field}>
      <Dropdown
        label={strings.ColumnVisibilityLabel}
        multiSelect={true}
        options={visibilityOptions}
        onChange={(_, opt) => {
          if (opt.selected) {
            setSelection([...selection, opt.key as string])
          } else {
            setSelection(selection.filter((s) => s !== opt.key))
          }
          props.onChange(selection)
        }}
      />
      <div className={styles.fieldDescription}>{strings.ColumnVisibilityDescription}</div>
    </div>
  )
}
