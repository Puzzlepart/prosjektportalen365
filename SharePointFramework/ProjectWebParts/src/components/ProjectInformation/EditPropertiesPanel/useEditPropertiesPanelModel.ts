import { IPersonaSharedProps, ITag } from '@fluentui/react'
import _ from 'lodash'
import { DefaultCaching } from 'pp365-shared-library/lib/data'
import { useState } from 'react'
import { ProjectInformationField } from '../ProjectInformationField'
import { useProjectInformationContext } from '../context'

/**
 * Hook for the `EditPropertiesPanel` model. This hook is used to get and set the values for
 * the fields in the `EditPropertiesPanel`, aswell as to transform the values to the correct type
 * for the `property` object that can be sent as a request body to the API.
 */
export function useEditPropertiesPanelModel() {
  const context = useProjectInformationContext()
  const [model, setModel] = useState(new Map<string, any>())
  const [properties, setProperties] = useState({})

  /**
   * Get value for field.
   *
   * Supports getting values for fields of type `tags`, `date`, `users` and `multichoice`.
   *
   * @param field Field to get value for
   * @param type Type of field to get value for (for parsing the value to the correct type)
   */
  function get<T>(
    field: ProjectInformationField,
    type: 'tags' | 'date' | 'users' | 'multichoice' = null
  ): T {
    const { fieldValues, fieldValuesText } = context.state.data
    const value = (model.get(field.internalName) as string) ?? fieldValuesText[field.internalName]
    if (!value) return null
    switch (type) {
      case 'tags': {
        return typeof value === 'string'
          ? (value.split(';').map((v) => ({ key: v, name: v })) as unknown as T)
          : (value as unknown as T)
      }
      case 'date': {
        return typeof value === 'string'
          ? (new Date(fieldValues[field.internalName]) as unknown as T)
          : (value as unknown as T)
      }
      case 'users': {
        if (typeof value !== 'string') return value as unknown as T
        const fieldValue = fieldValues[field.internalName]
        if (!fieldValue) return [] as unknown as T
        const users = (
          (_.isArray(fieldValue) ? fieldValue : [fieldValue]) as Array<{
            Id: number
            Title: string
            EMail: string
          }>
        ).map<IPersonaSharedProps>((v) => ({
          key: v.Id,
          text: v.Title,
          secondaryText: v.EMail,
          imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${v.EMail}`
        }))
        return users as unknown as T
      }
      case 'multichoice': {
        return typeof value === 'string'
          ? (value.split(';') as unknown as T)
          : (value as unknown as T)
      }
      default: {
        return value as unknown as T
      }
    }
  }

  /**
   * Transform value for the field returning the internal name of the field and the transformed value.
   *
   * @param value Value to be transformed
   * @param field Field to transform the value for
   *
   * @returns The transformed value and the internal name of the field (might be different from the field's internal name)
   */
  const transformValue = async (value: any, field: ProjectInformationField) => {
    const propertiesList = context.props.sp.web.lists.getById(context.state.data.propertiesListId)
    switch (field.type) {
      case 'TaxonomyFieldTypeMulti':
      case 'TaxonomyFieldType': {
        const textField = await propertiesList.fields
          .getById(field.getProperty('TextField'))
          .select('InternalName')
          .using(DefaultCaching)()
        return [
          textField.InternalName,
          (value as ITag[]).map((v) => `-1;#${v.name}|${v.key}`).join(';#')
        ]
      }
      case 'User': {
        return [field.internalName, value]
      }
      case 'UserMulti': {
        return [field.internalName, value]
      }
      default: {
        return [field.internalName, value]
      }
    }
  }

  /**
   * Set value for field.
   *
   * @param field Field to set value for
   * @param value Value to set (will be transformed to the correct type for the field)
   */
  const set = async <T>(field: ProjectInformationField, value: T) => {
    const [internalName, transformedValue] = await transformValue(value, field)
    model.set(field.internalName, value)
    setModel(new Map(model))
    setProperties({ ...properties, [internalName]: transformedValue })
  }

  /**
   * Returns `true` if any of the fields have been changed.
   */
  const isChanged = model.size > 0

  /**
   * Reset the model and properties.
   */
  const reset = () => {
    setModel(new Map())
    setProperties({})
  }

  return { model, set, get, properties, isChanged, reset }
}
