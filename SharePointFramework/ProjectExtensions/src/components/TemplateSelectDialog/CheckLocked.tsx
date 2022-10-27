import { Icon, IDetailsRowCheckProps } from '@fluentui/react'
import React, { FC } from 'react'

export const CheckLocked: FC<IDetailsRowCheckProps> = (props) => {
  return (
    <div id={props.id} className={props.className} style={props.style}>
      <Icon iconName='Lock' styles={{ root: { fontSize: 15 } }} />
    </div>
  )
}

CheckLocked.defaultProps = {
  style: { width: 48, padding: 12, boxSizing: 'border-box' }
}
