import _ from 'underscore'
import { ProjectInformationField } from './ProjectInformationField'
import { IProjectInformationContext } from './context'
import { IProjectInformationState } from './types'

/**
 * Hook for transforming the properties to `ProjectInformationField` objects.
 * 
 * @param context `ProjectInformation` context
 * 
 * @returns a function for transforming the properties and adding them to the passed
 * `data` object.
 */
export function usePropertiesTransform(context: IProjectInformationContext) {
  const transformProperties = (useVisibleFilter: boolean = true) => {
    const { fields, fieldValuesText, columns } = context.state.data
    const fieldNames: string[] = Object.keys(fieldValuesText).filter((fieldName) => {
      const [field] = fields.filter((fld) => fld.InternalName === fieldName)
      if (!field) return false
      if (_.isEmpty(columns) &&
        ((context.props.showFieldExternal || {})[fieldName] || context.props.skipSyncToHub)) {
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
  return async (data: Partial<IProjectInformationState>) => {
    return await Promise.resolve({
      ...data,
      properties: transformProperties(),
      allProperties: transformProperties(false)
    } as Partial<IProjectInformationState>)
  }
}
