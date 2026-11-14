import { TableRowId } from '@fluentui/react-components'
import { useState } from 'react'
import { isAddedBefore } from '../../../extensions/projectSetup/listContentRecord'
import { useProjectSetupDialogContext } from '../context'
import { ON_LIST_CONTENT_CONFIG_CHANGED } from '../reducer'
import { getSelectedCountText } from '../selectedCountText'
import { useSearchAnnouncement } from '../useSearchAnnouncement'
import { useColumns } from './useColumns'

/** Filters list content and manages mandatory selections, allowing existing content to be re-added. */
export function useContentConfigSection() {
  const context = useProjectSetupDialogContext()
  const [searchTerm, setSearchTerm] = useState('')

  const cloud = context.state.selectedTemplate?.isCloudTemplate
    ? context.state.resolvedCloudTemplate
    : undefined
  const allItems = (cloud ? cloud.contentConfig : context.props.data.contentConfig).filter(
    (contentConfig) => !contentConfig.hidden
  )

  const addedKeys = new Set(
    allItems
      .filter((item) =>
        isAddedBefore(context.props.data.addedListContent, context.state.selectedTemplate, item)
      )
      .map((item) => String(item.key))
  )

  const mandatoryKeys = new Set(
    allItems
      .filter(
        (item) =>
          item.isMandatoryForTemplate(context.state.selectedTemplate) &&
          !addedKeys.has(String(item.key))
      )
      .map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedContentConfig.map((e) => String(e.key)))

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
    context.state.selectedContentConfig.map((e) => String(e.key))
  )

  const onSelectionChange = (selectedIds: (string | number)[]) => {
    const newSelection = new Set(selectedIds.map(String))
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_LIST_CONTENT_CONFIG_CHANGED(selectedItems))
  }

  const columns = useColumns(mandatoryKeys, addedKeys)

  // Hidden selections are applied but never listed, so they are not counted.
  const visibleSelectedCount = context.state.selectedContentConfig.filter(
    (item) => !item.hidden
  ).length

  const selectedCountText = getSelectedCountText(visibleSelectedCount)
  useSearchAnnouncement(searchTerm, items.length, allItems.length)

  return {
    items,
    columns,
    selectedRowIds,
    onSelectionChange,
    searchTerm,
    onSearch: setSearchTerm,
    selectedCountText,
    // What the template requires stays selected; Tab into the list starts after it.
    lockedKeys: mandatoryKeys,
    hasAddedItems: addedKeys.size > 0
  }
}
