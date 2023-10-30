import React, { FC, useContext } from 'react'
import { ChangePhaseDialogContext } from '../context'
import { ChangingPhaseView, InitialView, SummaryView, View } from '../Views'

const VIEW_MAP: Record<View, JSX.Element> = {
  [View.Initial]: <InitialView />,
  [View.Summary]: <SummaryView />,
  [View.ChangingPhase]: <ChangingPhaseView />,
  [View.Confirm]: null
}

export const Content: FC = () => {
  const { state } = useContext(ChangePhaseDialogContext)
  return VIEW_MAP[state.view] ?? null
}
