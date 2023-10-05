import React, { FC } from 'react'
import { UseModelReturnType } from './useModel'

/**
 * Shows `model.properties` in a `pre` tag.
 */
export const DebugModel: FC<{ model: UseModelReturnType }> = (props) => {
  if (!DEBUG) return null
  return (
    <div>
      <pre style={{
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        background: 'rgba(0,0,0,0.1)',
        padding: 10,
      }}>
        {JSON.stringify(props.model.properties, null, 2)}
      </pre>
    </div>
  )
}

DebugModel.displayName = 'DebugModel'