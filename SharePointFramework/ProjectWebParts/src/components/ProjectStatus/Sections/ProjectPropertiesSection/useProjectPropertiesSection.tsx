import { useProjectStatusContext } from '../../../ProjectStatus/context'

export function useProjectPropertiesSection() {
  const context = useProjectStatusContext()
  return {
    fieldValues: {
      ...context.state.data.properties.fieldValues,
      ...context.state.selectedReport.fieldValues
    },
    fields: [...context.state.data.properties.fields, ...context.state.data.reportFields]
  } as const
}
