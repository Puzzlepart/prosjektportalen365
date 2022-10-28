import { Icon, TooltipHost } from '@fluentui/react'
import React, { FC } from 'react'
import { MandatoryCheckTooltip } from './MandatoryCheckTooltip'
import { IMandatoryCheckProps } from './types'

export const MandatoryCheck: FC<IMandatoryCheckProps> = (props) => {
  return (
    <TooltipHost content={<MandatoryCheckTooltip {...props.tooltip} />}>
      <div id={props.id} className={props.className} style={props.style}>
        <Icon {...props.iconProps} />
      </div>
    </TooltipHost>
  )
}

MandatoryCheck.defaultProps = {
  style: { width: 48, padding: '12px 8px 8px 16px', boxSizing: 'border-box' },
  iconProps: { iconName: 'Lock', styles: { root: { fontSize: 15 } } }
}
