import { IDropdownProps, IRenderFunction, Icon } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { ColumnRenderComponentRegistry } from '../registry'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'

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
    ColumnRenderComponentRegistry.getOption(props.defaultSelectedKey as string)
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
    options: ColumnRenderComponentRegistry.getOptions(),
    selectedKey: selectedOption?.key,
    onChange: (_event, option) => setSelectedOption(option),
    onRenderTitle: (options) => onRenderOption(_.first(options)),
    onRenderOption,
    disabled: selectedOption?.disabled
  } as IUseDataTypeDropdown
}
