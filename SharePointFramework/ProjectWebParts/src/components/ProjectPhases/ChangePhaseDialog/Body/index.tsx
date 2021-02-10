import React, { useContext } from 'react'
import { ChangePhaseDialogContext } from '../context'
import { ChangingPhaseView, InitialView, SummaryView, View } from '../Views'

export const Body = () => {
  const { state } = useContext(ChangePhaseDialogContext)
  switch (state.view) {
    case View.Initial: {
      const checklistItem = state.checklistItems[state.currentIdx]
      return (
        <InitialView checklistItem={checklistItem} />
      )
    }
    case View.Summary:
      return <SummaryView checklistItems={state.checklistItems} />
    case View.ChangingPhase:
      return <ChangingPhaseView />
    default:
      return null
  }
}
