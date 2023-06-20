import { ProjectStatusContext } from '../../../ProjectStatus/context'
import { useContext } from 'react'

export function useProjectPropertiesSection() {
  const context = useContext(ProjectStatusContext)
  return {
    fieldValues: {
      ...context.state.data.properties.fieldValues,
      ...context.state.selectedReport.fieldValues
    },
    fields: [
      ...context.state.data.properties.fields,
      ...context.state.data.reportFields
    ]
  } as const
}
