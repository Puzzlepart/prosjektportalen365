import React from 'react'
import { ChangingPhaseView, InitialView, SummaryView, View } from '../Views'
import IBodyProps from './types'

export const Body = (props: IBodyProps) => {
  switch (props.view) {
    case View.Initial: {
      const currentChecklistItem = props.checklistItems[props.currentIdx]
      return (
        <InitialView
          checklistItem={currentChecklistItem}
          nextCheckpoint={props.nextCheckpoint}
        />
      )
    }
    case View.Summary:
      return <SummaryView checklistItems={props.checklistItems} />
    case View.ChangingPhase:
      return <ChangingPhaseView />
    default:
      return null
  }
}
