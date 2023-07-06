import { IDropdownProps, IRenderFunction, Icon } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import {
  BooleanColumn,
  CurrencyColumn,
  DateColumn,
  FileNameColumn,
  ListColumn,
  ModalColumn,
  TagsColumn,
  TrendColumn,
  UrlColumn,
  UserColumn,
  getColumnDataTypeOptionsWithoutRenderComponent
} from '../List'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'

const dataTypeOptions: IColumnDataTypeFieldOption[] = [
  ...getColumnDataTypeOptionsWithoutRenderComponent(),
  BooleanColumn.getDataTypeOption(),
  CurrencyColumn.getDataTypeOption(),
  DateColumn.getDataTypeOption(),
  UserColumn.getDataTypeOption(),
  TagsColumn.getDataTypeOption(),
  UrlColumn.getDataTypeOption(),
  TrendColumn.getDataTypeOption(),
  ModalColumn.getDataTypeOption(),
  FileNameColumn.getDataTypeOption(),
  ListColumn.getDataTypeOption()
].sort((a, b) => a.text.localeCompare(b.text))

interface IUseDataTypeDropdown extends IDropdownProps {
  selectedOption: IColumnDataTypeFieldOption
}

/**
 * Hook that returns props for a dropdown component that allows users to select a column data type.
 *
 * @param props Props for the column data type dropdown component.
 *
 * @returns Props for a dropdown component that allows users to select a column data type.
 */
export function useDataTypeDropdown(props: IColumnDataTypeFieldProps) {
  const [selectedOption, setSelectedOption] = useState<IColumnDataTypeFieldOption>(
    _.find(dataTypeOptions, (option) => option.key === props.defaultSelectedKey)
  )

  const onChange = (option?: IColumnDataTypeFieldOption) => {
    if (!option) return
    props.onChange(option.id)
  }

  /**
   * Render function for dropdown options.
   *
   * @param option Option to render
   */
  const onRenderOption: IRenderFunction<IColumnDataTypeFieldOption> = (option) => (
    <div>
      {option.data?.iconProps && (
        <Icon {...option.data.iconProps} styles={{ root: { marginRight: 6 } }} />
      )}
      <span>{option.text}</span>
    </div>
  )

  useEffect(() => {
    onChange(selectedOption)
  }, [selectedOption])

  return {
    selectedOption,
    label: strings.ColumnRenderLabel,
    options: dataTypeOptions,
    selectedKey: selectedOption?.key,
    onChange: (_event, option) => setSelectedOption(option),
    onRenderTitle: (options) => onRenderOption(_.first(options)),
    onRenderOption,
    disabled: selectedOption?.disabled
  } as IUseDataTypeDropdown
}
