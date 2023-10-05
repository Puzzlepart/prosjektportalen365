import { Dropdown } from '@fluentui/react'
import React, { FC, useState } from 'react'
import { IColumnVisibilityFieldProps, visibilityOptions } from './types'

export const ColumnVisibilityField: FC<IColumnVisibilityFieldProps> = (props) => {
  const [selection, setSelection] = useState<string[]>([])
  return (
    <Dropdown
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
  )
}
