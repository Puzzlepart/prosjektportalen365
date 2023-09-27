import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { Button, ButtonProps } from '@fluentui/react-components'

export const ClosePanelButton: FC<ButtonProps> = (props) => {
  const context = useProjectInformationContext()
  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick && props.onClick(e)
        context.dispatch(CLOSE_PANEL())
      }}
    >
      {strings.CancelText}
    </Button>
  )
}
