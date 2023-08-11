import { IPersonaProps, ITag } from '@fluentui/react'
import _ from 'lodash'
import { DefaultCaching } from 'pp365-shared-library/lib/data'
import { useState } from 'react'
import { useProjectInformationContext } from '../context'
import { ProjectInformationField, ProjectInformationFieldValue } from '../types'

/**
 * Hook for the `EditPropertiesPanel` model. This hook is used to get and set the values for
 * the fields in the `EditPropertiesPanel`, aswell as to transform the values to the correct type
 * for the `property` object that can be sent as a request body to the API.
 */
export function useModel() {
  const context = useProjectInformationContext()
  const [model, setModel] = useState(new Map<string, any>())
  const [properties, setProperties] = useState({})

  /**
   * Get value for field.
   *
   * @param field Field to get value for
   * @param fallbackValue Value to return if the field has no value
   */
  function get<T>(field: ProjectInformationField, fallbackValue: T = null): T {
    const { fieldValues, fieldValuesText } = context.state.data
    const textValue =
      (model.get(field.internalName) as string) ?? fieldValuesText[field.internalName]
    const value: ProjectInformationFieldValue = {
      isSet: textValue !== undefined && textValue !== null && textValue !== '',
      text: textValue,
      $: fieldValues[field.internalName]
    }
    if (!value || typeof value.text !== 'string')
      return (value.text ?? fallbackValue) as unknown as T
    return field.getValue(value) as unknown as T
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
      case 'Boolean': {
        return [field.internalName, value]
      }
      case 'URL': {
        return [
          field.internalName,
          {
            Description: value.description,
            Url: value.url
          }
        ]
      }
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
        const email = value[0].secondaryText
        let val = null
        if (email) val = (await context.props.sp.web.ensureUser(email)).data.Id
        return [`${field.internalName}Id`, val]
      }
      case 'UserMulti': {
        const values = await Promise.all(
          value.map(
            async (v: IPersonaProps) =>
              (
                await context.props.sp.web.ensureUser(v.secondaryText)
              ).data.Id
          )
        )
        return [`${field.internalName}Id`, _.flatten(values)]
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
