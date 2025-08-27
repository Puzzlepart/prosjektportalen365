import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ProjectProvisionContext } from '../context'

/**
 * Custom hook to handle input field values locally to prevent cursor jumping
 * while still synchronizing with the context state.
 */
export const useLocalInput = (fieldName: string, debounceMs: number = 300) => {
  const context = useContext(ProjectProvisionContext)
  const [localValue, setLocalValue] = useState(() => context.column.get(fieldName) || '')
  const debounceRef = useRef<NodeJS.Timeout>()
  const lastContextValueRef = useRef<string>()

  useEffect(() => {
    const contextValue = context.column.get(fieldName) || ''

    if (contextValue !== lastContextValueRef.current && contextValue !== localValue) {
      setLocalValue(contextValue)
    }

    lastContextValueRef.current = contextValue
  }, [context.column, fieldName, localValue])

  const updateContext = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        context.setColumn(fieldName, value)
      }, debounceMs)
    },
    [context.setColumn, fieldName, debounceMs]
  )

  const handleChange = useCallback(
    (value: string) => {
      setLocalValue(value)

      context.setState({
        properties: {
          ...context.state.properties,
          [fieldName]: value
        }
      })

      updateContext(value)
    },
    [updateContext, context.setState, context.state.properties, fieldName]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    value: localValue,
    onChange: handleChange
  }
}
