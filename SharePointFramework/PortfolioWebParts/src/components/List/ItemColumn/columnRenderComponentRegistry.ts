/* eslint-disable no-console */
import { GetDataTypeProperties } from '../../ColumnDataTypeField/types'
import { ColumnRenderComponent } from './types'

/**
 * Registers a column render component with the given `component` and `getDataTypeProperties` function. A
 * function `getDataTypeOption` is added to the component that returns an option for the data type field.
 * This is used by the `ColumnDataTypeField` component to render the data type field in a dropdown.
 *
 * The component needs to have properties `key`, `id`, `displayName` and `iconName` defined.
 *
 * @param component The column render component to register.
 * @param getDataTypeProperties The function that returns the data type properties for the column.
 */
export function registerColumnRenderComponent(
  component: ColumnRenderComponent<any>,
  getDataTypeProperties: GetDataTypeProperties = () => []
) {
  if (!component.displayName) {
    console.warn('Column render components needs to have property "displayName" defined.')
    return
  }
  if (!component.key) {
    console.warn(
      `Column render component ${component.displayName} needs to have property "key" defined.`
    )
    return
  }
  if (!component.iconName) {
    console.warn(
      `Column render component ${component.displayName} needs to have property "iconName" defined.`
    )
    return
  }
  if (!component.id) {
    console.warn(
      `Column render component ${component.displayName} needs to have property "id" defined.`
    )
    return
  }
  component.getDataTypeOption = () => ({
    key: component.key,
    id: component.id,
    text: component.displayName,
    data: {
      iconProps: { iconName: component.iconName },
      getDataTypeProperties
    }
  })
}
