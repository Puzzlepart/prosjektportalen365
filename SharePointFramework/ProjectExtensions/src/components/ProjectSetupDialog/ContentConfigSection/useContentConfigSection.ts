import { format } from '@fluentui/react'
import { TableRowId } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { ContentConfig, ListMenuItem } from 'pp365-shared-library'
import { useState } from 'react'
import { useProjectSetupDialogContext } from '../context'
import { ON_LIST_CONTENT_CONFIG_CHANGED } from '../reducer'
import { useColumns } from './useColumns'

/**
 * Component logic hook for `ContentConfigSection`
 */
export function useContentConfigSection() {
  const context = useProjectSetupDialogContext()
  const [searchTerm, setSearchTerm] = useState('')

  const allItems = context.props.data.contentConfig.filter((contentConfig) => !contentConfig.hidden)

  const mandatoryKeys = new Set(
    allItems
      .filter((item) => item.isMandatoryForTemplate(context.state.selectedTemplate))
      .map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedContentConfig.map((e) => String(e.key)))

  // Sort: mandatory first, then selected, then unselected
  const sortedItems = [...allItems].sort((a: ContentConfig, b: ContentConfig) => {
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
    context.state.selectedContentConfig.map((e) => String(e.key))
  )

  const onSelectionChange = (_: any, data: { selectedItems: Set<TableRowId> }) => {
    const newSelection = new Set(data.selectedItems)
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_LIST_CONTENT_CONFIG_CHANGED(selectedItems))
  }

  const columns = useColumns(mandatoryKeys)

  const columnSizingOptions = {
    text: { minWidth: 150, defaultWidth: 200 },
    subText: { minWidth: 250, defaultWidth: 400 }
  }

  const toolbarItems = [
    new ListMenuItem(
      format(strings.SelectedCountLabel, context.state.selectedContentConfig.length),
      format(strings.SelectedCountLabel, context.state.selectedContentConfig.length)
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
    columnSizingOptions,
    toolbarItems
  }
}
