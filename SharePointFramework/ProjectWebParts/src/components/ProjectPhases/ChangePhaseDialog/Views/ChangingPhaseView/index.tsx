import { format, ProgressIndicator } from '@fluentui/react'
import { ProjectPhasesContext } from '../../../../ProjectPhases/context'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'

export const ChangingPhaseView: FC = () => {
  const context = useContext(ProjectPhasesContext)
  return (
    <ProgressIndicator
      label={strings.PleaseWaitText}
      description={format(strings.ChangingPhaseDescription, context.state.confirmPhase.name)}
    />
  )
}
