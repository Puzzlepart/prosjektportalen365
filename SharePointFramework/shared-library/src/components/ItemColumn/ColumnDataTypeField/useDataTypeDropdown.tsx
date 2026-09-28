import { IDropdownOption, IDropdownProps, IRenderFunction } from '@fluentui/react'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { getFluentIconWithFallback } from '../../../icons'
import { ColumnRenderComponentRegistry } from '../registry'
import { IColumnDataTypeFieldOption, IColumnDataTypeFieldProps } from './types'

interface IUseDataTypeDropdown extends IDropdownProps {
  selectedOption: IColumnDataTypeFieldOption
}

/**
 * Props for the data type dropdown: which registered column renderer is selected, and the
 * registry's options to choose from. Reports the selection to the caller by the renderer's stored
 * id, including the default on first render, which is how the column forms learn the initial type.
 *
 * The dropdown is the Fluent UI v8 `Dropdown` on purpose. The v9 `Dropdown` — like `TagPicker`,
 * and for the same reason: both are built on `@fluentui/react-combobox` — sends itself into an
 * endless render loop the moment it opens on this stack (SPFx 1.23 pins React 17), which kills the
 * Jest worker even in Fluent's own documented form. The option type is our own; the casts are
 * where v8 hands back its structurally identical option.
 *
 * @param props Props for the column data type field.
 */
export function useDataTypeDropdown(props: IColumnDataTypeFieldProps) {
  const [selectedOption, setSelectedOption] = useState<IColumnDataTypeFieldOption>(
    ColumnRenderComponentRegistry.getOption(props.defaultSelectedKey)
  )

  useEffect(() => {
    if (selectedOption) props.onChange(selectedOption.id)
  }, [selectedOption])

  /**
   * Renders an option as its icon and text. Icons are catalog names, resolved with the UI Fabric
   * fallback for the renderers that still name Fabric icons.
   */
  const onRenderOption: IRenderFunction<IDropdownOption> = (option) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {getFluentIconWithFallback((option as IColumnDataTypeFieldOption).data?.iconProps?.iconName)}
      <span>{option.text}</span>
    </span>
  )

  return {
    selectedOption,
    options: ColumnRenderComponentRegistry.getOptions(),
    selectedKey: selectedOption?.key,
    onChange: (_event, option) => setSelectedOption(option as IColumnDataTypeFieldOption),
    onRenderTitle: (options) => onRenderOption(_.first(options)),
    onRenderOption,
    disabled: selectedOption?.disabled
  } as IUseDataTypeDropdown
}
