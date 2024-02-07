import React from 'react'
import { ChangingPhaseView, InitialView, SummaryView, View } from '../Views'

export const VIEW_MAP: Record<View, JSX.Element> = {
  [View.Initial]: <InitialView />,
  [View.Summary]: <SummaryView />,
  [View.ChangingPhase]: <ChangingPhaseView />,
  [View.Confirm]: null
}
