import * as React from 'react'
import { useContext } from 'react'
import { ListContext } from './context'

export function useList() {
  const context = useContext(ListContext)
  const refMap = React.useRef<Record<string, HTMLElement | null>>({})

  const columnSizingOptions = context.columns.reduce(
    (options, col) => (
      (options[col.fieldName] = {
        minWidth: col.minWidth,
        defaultWidth: 120,
        idealWidth: col.idealWidth
      }),
      options
    ),
    {}
  )

  return { refMap, columnSizingOptions }
}
