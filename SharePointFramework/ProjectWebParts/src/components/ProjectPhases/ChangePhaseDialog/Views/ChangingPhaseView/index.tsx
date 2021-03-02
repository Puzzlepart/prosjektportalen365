import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { format } from 'office-ui-fabric-react/lib/Utilities'
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
