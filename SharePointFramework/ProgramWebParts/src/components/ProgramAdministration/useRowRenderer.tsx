import { IDetailsRowProps } from '@fluentui/react'

/**
 * Row renderer hook for `ProgramAdministration`. Returns an instance of
 * `onRenderRow`.
 */
export function useRowRenderer({ selectedKeys, searchTerm }) {
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const shouldRenderRow =
      detailsRowProps.item.Title.toLowerCase().indexOf(
        searchTerm.toLowerCase()
      ) !== -1 || selectedKeys.includes(detailsRowProps.item.key)
    return shouldRenderRow ? defaultRender(detailsRowProps) : null
  }
}
