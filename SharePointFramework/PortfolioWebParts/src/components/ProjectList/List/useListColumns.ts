import * as strings from 'PortfolioWebPartsStrings'
import { useContext } from 'react'
import _ from 'underscore'
import { ListContext } from './context'

export function useListColumns() {
  const context = useContext(ListContext)

  const getField = (item: any, field: string) => {
    const fieldValue = item.data[field]
    let values: string[] = []
    if (typeof fieldValue === 'string') {
      values = fieldValue?.split(';')
    } else {
      values = []
    }

    if (!values.length || (values.length === 1 && values[0] === '')) {
      const textValue = item.data[`${field}Text`]
      values = textValue ? textValue?.split(';') : []
    }

    return values.length ? values : []
  }

  const primaryUserRole =
    _.find(context.projectColumns, (col) => col.internalName === context.primaryUserField)?.name ||
    strings.PrimaryUserFieldLabel

  const secondaryUserRole =
    _.find(context.projectColumns, (col) => col.internalName === context.secondaryUserField)
      ?.name || strings.SecondaryUserFieldLabel

  const primaryField =
    _.find(context.projectColumns, (col) => col.internalName === context.primaryField)?.name ||
    strings.PrimaryFieldLabel

  const secondaryField =
    _.find(context.projectColumns, (col) => col.internalName === context.secondaryField)?.name ||
    strings.SecondaryFieldLabel

  return {
    getField,
    primaryUserRole,
    secondaryUserRole,
    primaryField,
    secondaryField
  }
}
