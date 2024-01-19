import { useProjectStatusContext } from '../../../ProjectStatus/context'

export function useProjectPropertiesSection() {
  const context = useProjectStatusContext()
  return {
    fieldValues: {
      ...context.state.data.properties.fieldValues['_fieldValuesAsText'],
      ...context.state.selectedReport?.fieldValues['_fieldValuesAsText']
    },
    fields: [...context.state.data.properties.fields, ...context.state.data.reportFields]
  }
}
