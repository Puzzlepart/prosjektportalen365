import React, { FC } from 'react'
import { useUnSustainabilityGoals } from './useUnSustainabilityGoals'

export const UnSustainabilityGoals: FC = () => {
  const {
    UnSustGoals
  } = useUnSustainabilityGoals()

  return (
    <div>
      {UnSustGoals && UnSustGoals.value && UnSustGoals.value.length > 0 && (
        <ul>
          {UnSustGoals.value.map((entry: any, index: number) => (
            <li key={index}>{entry.Label}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
