import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import IChangingPhaseViewProps from './IChangingPhaseViewProps'

/**
 * @component ChangingPhaseView
 */

export const ChangingPhaseView = (props: IChangingPhaseViewProps) => {
  return (
    <ProgressIndicator
      label={strings.PleaseWaitText}
      description={format(strings.ChangingPhaseDescription, props.newPhase.name)}
    />
  )
}
