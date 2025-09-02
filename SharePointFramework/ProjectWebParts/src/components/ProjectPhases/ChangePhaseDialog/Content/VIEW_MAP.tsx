import React from 'react'
import { ArchiveView, ChangingPhaseView, InitialView, SummaryView, View } from '../Views'

export const VIEW_MAP: Record<View, JSX.Element> = {
  [View.Initial]: <InitialView />,
  [View.Summary]: <SummaryView />,
  [View.Archive]: <ArchiveView />,
  [View.ChangingPhase]: <ChangingPhaseView />,
  [View.Confirm]: null
}
