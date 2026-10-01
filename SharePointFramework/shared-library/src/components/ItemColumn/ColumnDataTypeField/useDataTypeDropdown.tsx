import { DropdownProps } from '@fluentui/react-components'
import { useEffect, useState } from 'react'
import { ColumnRenderComponentRegistry } from '../registry'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'

export interface IUseDataTypeDropdown {
  /**
   * The option currently selected, if any.
   */
  selectedOption: IColumnDataTypeFieldOption

  /**
   * Every registered data type, in registry order.
   */
  options: IColumnDataTypeFieldOption[]

  /**
   * Selects the option whose key the dropdown reports.
   */
  onOptionSelect: DropdownProps['onOptionSelect']

  /**
   * Whether the dropdown is disabled. It is when the selected type cannot be chosen any more.
   */
  disabled: boolean
}

/**
 * State for the data type dropdown: which registered column renderer is selected, and the
 * registry's options to choose from. Reports the selection to the caller by the renderer's stored
 * id, including the default on first render, which is how the column forms learn the initial type.
 *
 * The dropdown is the v9 `Dropdown`, like the visibility `Combobox` beside it in the column form.
 * The v8 `Dropdown` it replaced rendered its list in the v8 layer, underneath the v9 drawer. Both
 * are built on `@fluentui/react-combobox`, which opens fine in the browser and loops under Jest on
 * React 17, so the tests cover everything but opening it; that is checked by hand.
 *
 * @param props Props for the column data type field.
 */
export function useDataTypeDropdown(props: IColumnDataTypeFieldProps): IUseDataTypeDropdown {
  const [selectedOption, setSelectedOption] = useState<IColumnDataTypeFieldOption>(
    ColumnRenderComponentRegistry.getOption(props.defaultSelectedKey)
  )
  const options = ColumnRenderComponentRegistry.getOptions()

  useEffect(() => {
    if (selectedOption) props.onChange(selectedOption.id)
  }, [selectedOption])

  return {
    selectedOption,
    options,
    onOptionSelect: (_event, data) => {
      const option = options.find((o) => o.key === data.optionValue)
      if (option) setSelectedOption(option)
    },
    disabled: !!selectedOption?.disabled
  }
}
