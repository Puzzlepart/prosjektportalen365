import React, { FC } from 'react'
import { useCustomEditPanelContext } from './context'

/**
 * Shows `model.properties` in a `pre` tag.
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
