import { useContext } from 'react'
import { ProjectCardContext } from '../context'
import _ from 'underscore'

/**
 * Component logic hook for `ProjectCardContent`
 */
export function useProjectCardContent() {
  const context = useContext(ProjectCardContext)

  const getField = (field: string) => {
    const fieldValue = context.project?.data[field]
    let values: string[] = []
    if (typeof fieldValue === 'string') {
      values = fieldValue.split(';')
      if (!values.length || (values.length === 1 && values[0] === "")) {
        const textValue = context.project?.data[`${field}Text`]
        values = textValue ? [textValue] : []
      }
    }
    else {
      values = []
    }

    const column = context.projectColumns?.find(col => col.fieldName.includes(field))
    return values.length
      ? { tags: values, text: column?.name }
      : undefined
  }

  return {
    primaryField: getField(context.primaryField),
    secondaryField: getField(context.secondaryField),
    shouldDisplay: context.shouldDisplay
  }
}
