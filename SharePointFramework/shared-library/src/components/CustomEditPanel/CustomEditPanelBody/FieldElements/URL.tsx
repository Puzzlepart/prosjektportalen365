import { Input } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { useState, useEffect } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const URL: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const [validationMessage, setValidationMessage] = useState<string>(null)
  const [validationState, setValidationState] = useState<'error' | 'none'>('none')
  const value = context.model.get<{
    url: string
    description: string
  }>(field, { url: '', description: '' })

  const clearValidation = () => {
    setValidationState('none')
    setValidationMessage(null)
    context.clearValidationError(field.internalName)
  }

  const validateUrl = (url: string) => {
    if (!url) {
      clearValidation()
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      const message = strings.Validation.UrlFieldInvalidFormat
      setValidationState('error')
      setValidationMessage(message)
      context.setValidationError(field.internalName, message)
      return
    }
    clearValidation()
  }

  useEffect(() => {
    if (value.url) {
      validateUrl(value.url)
    }
  }, [])

  return (
    <FieldContainer
      iconName='LinkMultiple'
      label={field.displayName}
      description={field.description}
      required={field.required}
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Input
        defaultValue={value.url}
        onChange={(_, data) => {
          validateUrl(data.value)
          context.model.set(field, { url: data.value, description: value.description })
        }}
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
