import React, { FC } from 'react'
import { useProjectProvisionContext } from '../context'

/**
 * Shows `model.properties` in a `pre` tag.
 */
export const DebugModel: FC = () => {
  const context = useProjectProvisionContext()
  return (
    <div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          background: 'rgba(0,0,0,0.1)',
          padding: 10,
          borderRadius: 5
        }}
      >
        {JSON.stringify(context.state.properties, null, 2)}
      </pre>
    </div>
  )
}

DebugModel.displayName = 'DebugModel'
