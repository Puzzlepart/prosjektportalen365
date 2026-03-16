import { useProjectInformationContext } from "../context"
import React, { FC } from 'react'

export function useUnSustainabilityGoals() {
  const context = useProjectInformationContext()
  const UnSustGoals = context.state.data.fieldValues.get('GtUNSustDevGoals')

  return {
    UnSustGoals
  }
}

