import { Switch } from '@fluentui/react-components'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const Boolean: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer iconName='ToggleLeft' label={field.displayName} description={field.description}>
      <Switch
        checked={context.model.get<boolean>(field)}
        onChange={(_, data) => context.model.set(field, data.checked)}
      />
    </FieldContainer>
  )
}
