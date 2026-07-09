import React, { FC } from 'react'
import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import { useProjectInformationContext } from '../context'
import { ProjectProperty } from '../ProjectProperties/ProjectProperty'

export interface UnSustainabilityGoalsProps {}

export const UnSustainabilityGoals: FC<UnSustainabilityGoalsProps> = () => {
  const context = useProjectInformationContext()
  const fluentProviderId = useId('fp-unsust-goals')
  const model = context.state.properties.find((p) => p.internalName === 'GtUNSustDevGoals')
  if (!model || model.isEmpty) return null
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <ProjectProperty model={model} />
      </FluentProvider>
    </IdPrefixProvider>
  )
}
