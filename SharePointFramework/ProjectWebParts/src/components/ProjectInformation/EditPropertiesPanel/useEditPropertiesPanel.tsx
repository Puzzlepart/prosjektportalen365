import { DatePicker, Dropdown, TextField } from '@fluentui/react'
import React, { useContext, useMemo } from 'react'
import { ProjectInformationContext } from '../context'
import { IProjectInformationField } from '../types'

/**
 * Hook for `EditPropertiesPanel` component
 *
 * @returns `fields` and `getFieldElement` properties
 */
export function useEditPropertiesPanel() {
  const context = useContext(ProjectInformationContext)
  const fields = useMemo<IProjectInformationField[]>(() => context.state.data.fields.filter(
    (fld: IProjectInformationField) => fld.ShowInEditForm !== false
  ), [context.state.data])
  const fieldElements: Record<string, (field: IProjectInformationField) => JSX.Element> = {
    Text: (field) => <TextField label={field.Title} />,
    Note: (field) => <TextField label={field.Title} multiline />,
    DateTime: (field) => <DatePicker label={field.Title} />,
    Choice: (field) => <Dropdown label={field.Title} options={[]} />,
    MultiChoice: (field) => (
      <Dropdown
        label={field.Title}
        options={field.Choices.map((c) => ({ key: c, text: c }))}
        multiSelect
      />
    )
  }
  const getFieldElement = (field: IProjectInformationField) => {
    return fieldElements[field.TypeAsString] && fieldElements[field.TypeAsString](field)
  }
  return { fields, getFieldElement } as const
}
