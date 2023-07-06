import { ICheckboxProps, IDropdownProps, IIconProps, ISelectableOption } from '@fluentui/react'

export type IColumnDataTypePropertyField = [React.ComponentType, any]

type IColumnDataTypeFieldOptionData = {
  /**
   * Icon props for the option
   */
  iconProps: IIconProps

  /**
   * Get properties for the data type.
   *
   * @param onChange On change handler for the property field
   * @param dataTypeProperties Current data type properties for the data type
   */
  getDataTypeProperties?: (
    onChange: (key: string, value: any) => void,
    dataTypeProperties: Record<string, any>
  ) => IColumnDataTypePropertyField[]
}

export type IColumnDataTypeFieldOption = ISelectableOption<IColumnDataTypeFieldOptionData>

export interface IColumnDataTypeFieldProps extends Pick<IDropdownProps, 'defaultSelectedKey'> {
  description: string
  onChange: (value: string) => void
  dataTypeProperties?: Record<string, any>
  onDataTypePropertiesChange?: (properties: Record<string, any>) => void
  persistRenderGloballyField?: ICheckboxProps
}
