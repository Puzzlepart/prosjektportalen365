import { format, ProgressIndicator } from '@fluentui/react'
import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import * as strings from 'ProjectWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'

export const ChangingPhaseView: FunctionComponent = () => {
  const context = useContext(ProjectPhasesContext)
  return (
    <ProgressIndicator
      label={strings.PleaseWaitText}
      description={format(strings.ChangingPhaseDescription, context.state.confirmPhase.name)}
    />
  )
}
