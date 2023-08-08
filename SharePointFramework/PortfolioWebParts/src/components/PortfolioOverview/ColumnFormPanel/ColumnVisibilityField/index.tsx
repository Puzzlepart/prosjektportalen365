import { Dropdown } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useState } from 'react'
import { IColumnVisibilityFieldProps, visibilityOptions } from './types'

export const ColumnVisibilityField: FC<IColumnVisibilityFieldProps> = (props) => {
  const [selection, setSelection] = useState<string[]>([])
  return (
    <FormFieldContainer description={strings.ColumnVisibilityDescription}>
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
    </FormFieldContainer>
  )
}
