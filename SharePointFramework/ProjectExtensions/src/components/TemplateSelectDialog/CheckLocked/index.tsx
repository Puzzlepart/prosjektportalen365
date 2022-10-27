import { Icon, TooltipHost } from '@fluentui/react'
import React, { FC } from 'react'
import { CheckLockedTooltipContent } from './CheckLockedTooltipContent'
import { ICheckLockedProps } from './types'

export const CheckLocked: FC<ICheckLockedProps> = (props) => {
  return (
    <TooltipHost content={<CheckLockedTooltipContent {...props.tooltip} />}>
      <div id={props.id} className={props.className} style={props.style}>
        <Icon {...props.iconProps} />
      </div>
    </TooltipHost>
  )
}

CheckLocked.defaultProps = {
  style: { width: 48, padding: '12px 8px 8px 16px', boxSizing: 'border-box' },
  iconProps: { iconName: 'Lock', styles: { root: { fontSize: 15 } } }
}
