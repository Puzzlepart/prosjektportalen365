import { PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import React from 'react'
import { IStatusOptionsProps } from './types'

export const StatusOptions = ({ actions }: IStatusOptionsProps) => {
  return (
    <div style={{ marginTop: 20, marginBottom: 25 }}>
      {actions.map((opt, key) => (
        <span key={key}>
          <PrimaryButton style={{ marginRight: 5 }} {...opt} />
        </span>
      ))}
    </div>
  )
}
