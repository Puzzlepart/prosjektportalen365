import { useContext, useState } from 'react'
import { ProjectInformationContext } from '../context'
import { ProjectInformationField } from '../types'

/**
 * Hook for the `EditPropertiesPanel` model.
 */
export function useEditPropertiesPanelModel() {
  const context = useContext(ProjectInformationContext)
  const [model, setModel] = useState(new Map<string, any>())

  function get<T>(field: ProjectInformationField, type: string = null): T {
    const { fieldValues, fieldValuesText } = context.state.data
    const value = (model.get(field.internalName) as string) ?? fieldValuesText[field.internalName]
    if (!value) return null
    switch (type) {
      case 'tags': {
        return value.split(';').map((v) => ({ key: v, name: v })) as unknown as T
      }
      case 'date': {
        return new Date(fieldValues[field.internalName]) as unknown as T
      }
      case 'users': {
        return value.split(';').map((v) => ({ key: v, text: v })) as unknown as T
      }
      default: {
        return value as unknown as T
      }
    }
  }

  function set(field: ProjectInformationField, value: any) {
    model.set(field.internalName, value)
    setModel(new Map(model))
  }

  return { model, set, get } as const
}
