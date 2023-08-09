import { DatePicker, Dropdown, TextField } from '@fluentui/react'
import React, { useContext, useMemo } from 'react'
import { ProjectInformationContext } from '../context'
import { ProjectInformationField } from '../types'

/**
 * Hook for `EditPropertiesPanel` component
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const context = useContext(ProjectInformationContext)
  const fields = useMemo<ProjectInformationField[]>(() => context.state.data.fields.map(
    (fld) => {
      const column = context.state.data.columns.find(col => col.internalName === fld.InternalName)
      return new ProjectInformationField(fld, column)
    }
  ).filter(f => f.showInEditForm), [context.state.data])

  /**
   * A mapping of field types to elements to render for them.
   */
  const fieldElements: Record<string, (field: ProjectInformationField) => JSX.Element> = {
    Text: (field) => <TextField label={field.title} />,
    Note: (field) => <TextField label={field.title} multiline />,
    DateTime: (field) => <DatePicker label={field.title} />,
    Choice: (field) => <Dropdown label={field.title} options={[]} />,
    MultiChoice: (field) => (
      <Dropdown
        label={field.title}
        options={field.choices.map((c) => ({ key: c, text: c }))}
        multiSelect
      />
    )
  }
  
  /**
   * Get element to render for the specified field.
   * 
   * @param field Field to get element for
   */
  const getFieldElement = (field: ProjectInformationField) => {
    return fieldElements[field.type] && fieldElements[field.type](field)
  }

  return { fields, getFieldElement } as const
}
