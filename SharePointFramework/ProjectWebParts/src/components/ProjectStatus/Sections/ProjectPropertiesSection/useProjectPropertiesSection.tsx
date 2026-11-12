import { useProjectStatusContext } from '../../../ProjectStatus/context'

/** Combines project and selected-report values for the properties section. */
export function useProjectPropertiesSection() {
  const context = useProjectStatusContext()

  return {
    fieldValues: {
      ...context.state.data.properties.fieldValues['_fieldValues'],
      ...context.state.selectedReport?.fieldValues['_fieldValues']
    },
    fieldValuesAsText: {
      ...context.state.data.properties.fieldValues['_fieldValuesAsText'],
      ...context.state.selectedReport?.fieldValues['_fieldValuesAsText']
    },
    fields: [...context.state.data.properties.fields, ...context.state.data.reportFields]
  }
}
