import { TextField } from '@fluentui/react'
import React from 'react'

/**
 * Hook for getting field elements.
 */
export function useFieldElements() {
  const fieldElements: Record<string, (field: Record<string, any>) => JSX.Element> = {
    Text: (field: Record<string, any>) => <TextField label={field.Title} />
  }
  const getFieldElement = (field: Record<string, any>) => {
    return fieldElements[field.TypeAsString] && fieldElements[field.TypeAsString](field)
  }
  return { getFieldElement } as const
}
