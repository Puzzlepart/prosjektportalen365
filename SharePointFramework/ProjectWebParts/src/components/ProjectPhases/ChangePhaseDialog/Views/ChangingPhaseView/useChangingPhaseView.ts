import { useAnnounce } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useContext, useEffect } from 'react'
import { ProjectPhasesContext } from '../../../context'

/**
 * Component logic hook for `ChangingPhaseView`. Announces the change of phase as it starts (WCAG
 * 4.1.3): the dialog's buttons go, and the focus with them, so a screen reader would otherwise say
 * nothing until the dialog closes.
 */
export function useChangingPhaseView() {
  const context = useContext(ProjectPhasesContext)
  const { announce } = useAnnounce()
  const description = format(strings.ChangingPhaseDescription, context.state.confirmPhase.name)

  useEffect(() => {
    announce(format(strings.Aria.ChangingPhaseAnnouncement, strings.PleaseWaitText, description), {
      polite: true
    })
  }, [announce, description])

  return { description }
}
