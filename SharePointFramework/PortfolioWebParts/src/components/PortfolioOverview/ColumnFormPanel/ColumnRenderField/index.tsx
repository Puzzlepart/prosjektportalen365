import {
  Dropdown,
  IDropdownOption,
  IRenderFunction,
  ISelectableOption,
  Icon
} from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import styles from '../ColumnFormPanel.module.scss'
import { IColumnRenderFieldProps, renderAsOptions } from './types'
import _ from 'lodash'

export const ColumnRenderField: FC<IColumnRenderFieldProps> = (props) => {
  const onRenderOption: IRenderFunction<ISelectableOption<any>> = (option) => (
    <div>
      {option.data?.iconProps && (
        <Icon {...option.data.iconProps} styles={{ root: { marginRight: 6 } }} />
      )}
      <span>{option.text}</span>
    </div>
  )

  return (
    <div className={styles.field}>
      <Dropdown
        label={strings.ColumnRenderLabel}
        options={renderAsOptions}
        onChange={(_e, option) => {
          const value = _.capitalize(option.key as string)
            .split('_')
            .join(' ')
          props.onChange(value)
        }}
        onRenderTitle={(options: IDropdownOption[]) => {
          const selectedOption = _.first(options)
          return onRenderOption(selectedOption)
        }}
        onRenderOption={onRenderOption}
      />
    </div>
  )
}
