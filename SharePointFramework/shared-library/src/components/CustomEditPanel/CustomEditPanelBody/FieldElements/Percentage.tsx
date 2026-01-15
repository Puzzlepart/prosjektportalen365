import { Input } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { FieldContainer } from '../../../FieldContainer'
import { useCustomEditPanelContext } from '../../context'
import { FieldElementComponent } from './types'

export const Percentage: FieldElementComponent = ({ field }) => {
  const context = useCustomEditPanelContext()
  
  const storedValue = context.model.get<number>(field)
  const displayValue = storedValue != null ? Math.round(storedValue * 100).toString() : ''

  const handleChange = (_: any, data: any) => {
    const inputValue = data.value
    if (inputValue === '' || inputValue == null) {
      context.model.set(field, null)
      return
    }
    
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, Math.min(100, numValue))
      const decimalValue = clampedValue / 100
      context.model.set(field, decimalValue)
    }
  }

  return (
    <FieldContainer
      iconName='NumberSymbol'
      label={field.displayName}
      description={field.description}
      required={field.required}
    >
      <Input
        type='number'
        min={0}
        max={100}
        value={displayValue}
        onChange={handleChange}
        placeholder={strings.Placeholder.NumberField}
        contentAfter="%"
      />
    </FieldContainer>
  )
}
