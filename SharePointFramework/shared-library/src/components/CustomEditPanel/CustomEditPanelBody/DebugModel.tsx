import React, { FC } from 'react'
import { useCustomEditPanelContext } from '../context'

/**
 * Displays the edit model's pending update payload for diagnostics.
 */
export const DebugModel: FC = () => {
  const context = useCustomEditPanelContext()
  return (
    <div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          background: 'rgba(0,0,0,0.1)',
          padding: 10
        }}
      >
        {JSON.stringify(context.model.properties, null, 2)}
      </pre>
    </div>
  )
}

DebugModel.displayName = 'DebugModel'
