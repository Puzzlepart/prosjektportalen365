import { format } from '@fluentui/react'
import { TableRowId } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { ListMenuItem, ProjectExtension } from 'pp365-shared-library'
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

  const allItems = context.props.data.extensions.filter((ext) => !ext.hidden)

  const mandatoryKeys = new Set(
    allItems
      .filter((item) => item.isMandatoryForTemplate(context.state.selectedTemplate))
      .map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedExtensions.map((e) => String(e.key)))

  // Sort: mandatory first, then selected, then unselected
  const sortedItems = [...allItems].sort((a: ProjectExtension, b: ProjectExtension) => {
    const aOrder = mandatoryKeys.has(String(a.key)) ? 0 : selectedKeys.has(String(a.key)) ? 1 : 2
    const bOrder = mandatoryKeys.has(String(b.key)) ? 0 : selectedKeys.has(String(b.key)) ? 1 : 2
    return aOrder - bOrder
  })

  // Filter by search (always show selected items)
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

  const onSelectionChange = (_: any, data: { selectedItems: Set<TableRowId> }) => {
    const newSelection = new Set(data.selectedItems)
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_EXTENSIONS_CHANGED(selectedItems))
  }

  const columns = useColumns(mandatoryKeys)

  const columnSizingOptions = {
    text: { minWidth: 150, defaultWidth: 200 },
    subText: { minWidth: 250, defaultWidth: 400 }
  }

  const showSearch = allItems.length >= 5

  const toolbarItems = [
    new ListMenuItem(
      format(strings.SelectedCountLabel, context.state.selectedExtensions.length)
    ).setDisabled(true)
  ]

  return {
    items,
    columns,
    selectedRowIds,
    onSelectionChange,
    searchTerm,
    onSearch: setSearchTerm,
    columnSizingOptions,
    showSearch,
    toolbarItems
  }
}
