import { Icon } from '@fluentui/react'
import React, { FC } from 'react'
import { ICheckLockedProps } from './types'

export const CheckLocked: FC<ICheckLockedProps> = (props) => {
  return (
    <div id={props.id} className={props.className} style={props.style}>
      <Icon {...props.iconProps} />
    </div>
  )
}

CheckLocked.defaultProps = {
  style: { width: 48, padding: 12, boxSizing: 'border-box' },
  iconProps: { iconName: 'Lock', styles: { root: { fontSize: 15 } } }
}
