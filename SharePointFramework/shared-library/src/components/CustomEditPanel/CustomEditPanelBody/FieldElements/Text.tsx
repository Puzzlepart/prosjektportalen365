import { Input } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const Text: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  return (
    <FieldContainer
      iconName='TextNumberFormat'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      <Input
        defaultValue={context.model.get<string>(field)}
        onChange={(_, data) => context.model.set(field, data.value)}
        placeholder={strings.Placeholder.TextField}
      />
    </FieldContainer>
  )
}
