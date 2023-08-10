import _ from 'underscore'
import { IProjectInformationContext } from './context'
import { IProjectInformationState, ProjectInformationField } from './types'

/**
 * Hook for transforming the properties to `ProjectInformationField` objects.
 *
 * @param context `ProjectInformation` context
 *
 * @returns a function for transforming the properties and adding them to the passed
 * `data` object.
 */
export function usePropertiesTransform(context: IProjectInformationContext) {
  const transformProperties = (
    { data }: Partial<IProjectInformationState>,
    useVisibleFilter: boolean = true
  ) => {
    const { fields, fieldValuesText, columns } = data
    const fieldNames: string[] = Object.keys(fieldValuesText).filter((fieldName) => {
      const [field] = fields.filter((fld) => fld.InternalName === fieldName)
      if (!field) return false
      if (
        _.isEmpty(columns) &&
        (context.props.showFieldExternal[fieldName] || context.props.skipSyncToHub)
      ) {
        return true
      }
      const [column] = columns.filter((c) => c.internalName === fieldName)
      return column ? (useVisibleFilter ? column.isVisible(context.props.page) : true) : false
    })

    const properties = fieldNames.map((fn) => {
      const [field] = fields.filter((fld) => fld.InternalName === fn)
      return new ProjectInformationField(field, null).setValue(fieldValuesText[fn])
    })
    return properties
  }
  return (data: Partial<IProjectInformationState>) =>
    Promise.resolve({
      ...data,
      properties: transformProperties(data),
      allProperties: transformProperties(data, false)
    } as Partial<IProjectInformationState>)
}
