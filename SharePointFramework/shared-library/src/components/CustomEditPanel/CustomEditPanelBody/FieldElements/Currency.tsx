import { Input } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { useState, useEffect } from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const Currency: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  const [validationMessage, setValidationMessage] = useState<string>(null)
  const [validationState, setValidationState] = useState<'error' | 'none'>('none')

  // Extract min and max values from field.column.data.dataTypeProperties
  const minValue = field.column?.data?.dataTypeProperties?.min
  const maxValue = field.column?.data?.dataTypeProperties?.max

  const validateValue = (value: string) => {
    if (!value) {
      setValidationState('none')
      setValidationMessage(null)
      context.clearValidationError(field.internalName)
      return
    }

    const numericValue = parseFloat(value)

    if (isNaN(numericValue)) {
      setValidationState('none')
      setValidationMessage(null)
      context.clearValidationError(field.internalName)
      return
    }

    if (minValue !== undefined && maxValue !== undefined) {
      if (numericValue < minValue || numericValue > maxValue) {
        const message = strings.Validation.NumberFieldMinMax.replace(
          '{0}',
          String(minValue)
        ).replace('{1}', String(maxValue))
        setValidationState('error')
        setValidationMessage(message)
        context.setValidationError(field.internalName, message)
        return
      }
    } else if (minValue !== undefined && numericValue < minValue) {
      const message = strings.Validation.NumberFieldMin.replace('{0}', String(minValue))
      setValidationState('error')
      setValidationMessage(message)
      context.setValidationError(field.internalName, message)
      return
    } else if (maxValue !== undefined && numericValue > maxValue) {
      const message = strings.Validation.NumberFieldMax.replace('{0}', String(maxValue))
      setValidationState('error')
      setValidationMessage(message)
      context.setValidationError(field.internalName, message)
      return
    }

    setValidationState('none')
    setValidationMessage(null)
    context.clearValidationError(field.internalName)
  }

  const handleChange = (_, data) => {
    validateValue(data.value)
    context.model.set(field, data.value || null)
  }

  // Validate initial value
  useEffect(() => {
    const initialValue = context.model.get<string>(field)
    if (initialValue) {
      validateValue(initialValue)
    }
  }, [])

  return (
    <FieldContainer
      iconName='Money'
      label={field.displayName}
      description={field.description}
      required={field.required}
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Input
        type='number'
        defaultValue={context.model.get<string>(field)}
        onChange={handleChange}
        placeholder={strings.Placeholder.TextField}
        min={minValue}
        max={maxValue}
      />
    </FieldContainer>
  )
}
