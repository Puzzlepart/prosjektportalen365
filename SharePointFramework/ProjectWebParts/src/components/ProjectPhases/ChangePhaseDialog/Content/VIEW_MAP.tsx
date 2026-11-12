import React from 'react'
import { ArchiveView, ChangingPhaseView, InitialView, SummaryView, View } from '../Views'

/** Maps phase-change steps to their content components. */
export const VIEW_MAP: Record<View, JSX.Element> = {
  [View.Initial]: <InitialView />,
  [View.Summary]: <SummaryView />,
  [View.Archive]: <ArchiveView />,
  [View.ChangingPhase]: <ChangingPhaseView />,
  [View.Confirm]: null
}
