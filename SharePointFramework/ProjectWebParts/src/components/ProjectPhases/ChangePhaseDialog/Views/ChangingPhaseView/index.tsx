import { format } from '@fluentui/react'
import { ProjectPhasesContext } from '../../../../ProjectPhases/context'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { Field, ProgressBar } from '@fluentui/react-components'

export const ChangingPhaseView: FC = () => {
  const context = useContext(ProjectPhasesContext)
  return (
    <Field
      label={strings.PleaseWaitText}
      hint={format(strings.ChangingPhaseDescription, context.state.confirmPhase.name)}
      validationState='none'
    >
      <ProgressBar />
    </Field>
  )
}
