import { IDropdownProps, IIconProps, ISelectableOption } from '@fluentui/react'

export type ColumnRenderFieldOptionAdditionalField = [React.ComponentType, any]

export type ColumnRenderFieldOption = ISelectableOption<{
  iconProps: IIconProps
  getDataTypeProperties?: (
    onChange: (key: string, value: any) => void,
    dataTypeProperties: Record<string, any>
  ) => ColumnRenderFieldOptionAdditionalField[]
}>

export interface IColumnRenderFieldProps extends Pick<IDropdownProps, 'defaultSelectedKey'> {
  description: string
  onChange: (value: string) => void
  dataTypeProperties?: Record<string, any>
  onDataTypePropertiesChange?: (properties: Record<string, any>) => void
}
