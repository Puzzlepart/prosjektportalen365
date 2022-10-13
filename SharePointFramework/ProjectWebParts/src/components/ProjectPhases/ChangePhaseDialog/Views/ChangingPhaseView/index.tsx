import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator'
import { format } from '@fluentui/react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext } from 'react'

export const ChangingPhaseView = () => {
  const context = useContext(ProjectPhasesContext)
  return (
    <ProgressIndicator
      label={strings.PleaseWaitText}
      description={format(strings.ChangingPhaseDescription, context.state.confirmPhase.name)}
    />
  )
}
