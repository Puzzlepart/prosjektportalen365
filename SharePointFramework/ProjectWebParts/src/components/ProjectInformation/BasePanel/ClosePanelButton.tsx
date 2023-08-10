import { DefaultButton } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_PANEL } from '../reducer'
import { IClosePanelButtonProps } from './types'

export const ClosePanelButton: FC<IClosePanelButtonProps> = (props) => {
  const context = useProjectInformationContext()
  return (
    <DefaultButton
      {...props}
      text={strings.CancelText}
      styles={{ root: { marginLeft: props.noMargin ? 0 : 8 } }}
      onClick={(e) => {
        props.onClick(e)
        context.dispatch(CLOSE_PANEL())
      }}
    />
  )
}
