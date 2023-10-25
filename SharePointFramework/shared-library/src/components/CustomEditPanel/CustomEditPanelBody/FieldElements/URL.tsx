import { Input } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const URL: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const value = context.model.get<{
    url: string
    description: string
  }>(field, { url: '', description: '' })
  return (
    <FieldContainer
      iconName='LinkMultiple'
      label={field.displayName}
      description={field.description}
    >
      <Input
        defaultValue={value.url}
        onChange={(_, data) =>
          context.model.set(field, { url: data.value, description: value.description })
        }
        placeholder={strings.Placeholder.UrlField}
      />
      <Input
        defaultValue={value.description}
        onChange={(_, data) =>
          context.model.set(field, { url: value.url, description: data.value })
        }
        placeholder={strings.Placeholder.UrlFieldAlternative}
        style={{ marginTop: 6 }}
      />
    </FieldContainer>
  )
}
