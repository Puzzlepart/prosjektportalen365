import { Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useState } from 'react'
import styles from '../ColumnFormPanel.module.scss'
import { IColumnVisibilityFieldProps, visibilityOptions } from './types'

export const ColumnVisibilityField: FC<IColumnVisibilityFieldProps> = (props) => {
  const [selection, setSelection] = useState<string[]>([])
  return (
    <div className={styles.field}>
      <Dropdown
        label={strings.ColumnVisibilityLabel}
        multiSelect={true}
        options={visibilityOptions}
        defaultSelectedKeys={props.defaultSelectedKeys}
        onChange={(_e, { key, selected }) => {
          let _selection = [...selection]
          if (selected) {
            _selection.push(key as string)
          } else {
            _selection = _selection.filter((s) => s !== key)
          }
          setSelection(_selection)
          props.onChange(_selection)
        }}
      />
      <div className={styles.fieldDescription}>{strings.ColumnVisibilityDescription}</div>
    </div>
  )
}
