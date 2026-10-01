import { TableRowId } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { ListMenuItem, format } from 'pp365-shared-library'
import { useState } from 'react'
import { useProjectSetupDialogContext } from '../context'
import { ON_EXTENSIONS_CHANGED } from '../reducer'
import { useColumns } from './useColumns'

/**
 * Component logic hook for `ExtensionsSection`
 */
export function useExtensionsSection() {
  const context = useProjectSetupDialogContext()
  const [searchTerm, setSearchTerm] = useState('')

  const cloud = context.state.selectedTemplate?.isCloudTemplate
    ? context.state.resolvedCloudTemplate
    : undefined
  const allItems = (cloud ? cloud.extensions : context.props.data.extensions).filter(
    (ext) => !ext.hidden
  )

  const mandatoryKeys = new Set(
    allItems
      .filter((item) => item.isMandatoryForTemplate(context.state.selectedTemplate))
      .map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedExtensions.map((e) => String(e.key)))

  // Mandatory items first, then the selected ones, then the rest, each group in title order.
  const rank = (item: { key: string | number }) =>
    mandatoryKeys.has(String(item.key)) ? 0 : selectedKeys.has(String(item.key)) ? 1 : 2
  const sortedItems = [...allItems].sort(
    (a, b) => rank(a) - rank(b) || a.text.localeCompare(b.text, 'nb')
  )

  const items = searchTerm
    ? sortedItems.filter(
        (item) =>
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selectedKeys.has(String(item.key))
      )
    : sortedItems

  const selectedRowIds = new Set<TableRowId>(
    context.state.selectedExtensions.map((e) => String(e.key))
  )

  const onSelectionChange = (selectedIds: (string | number)[]) => {
    const newSelection = new Set(selectedIds.map(String))
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_EXTENSIONS_CHANGED(selectedItems))
  }

  const columns = useColumns(mandatoryKeys)

  // Hidden selections are applied but never listed, so they are not counted.
  const visibleSelectedCount = context.state.selectedExtensions.filter(
    (item) => !item.hidden
  ).length

  const toolbarItems = [
    new ListMenuItem(
      format(strings.SelectedCountLabel, visibleSelectedCount),
      format(strings.SelectedCountLabel, visibleSelectedCount)
    )
      .setIcon('CheckmarkCircle')
      .setDisabled(true)
      .setStyle({ minWidth: '200px', cursor: 'default' })
  ]

  return {
    items,
    columns,
    selectedRowIds,
    onSelectionChange,
    searchTerm,
    onSearch: setSearchTerm,
    toolbarItems
  }
}
