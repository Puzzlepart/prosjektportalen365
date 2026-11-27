import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { useState } from 'react'
import { useProjectSetupDialogContext } from '../context'
import { ON_EXTENSIONS_CHANGED } from '../reducer'
import { SEARCH_MIN_ITEMS } from '../types'
import { useItemOrder } from '../useItemOrder'
import { useSearchAnnouncement } from '../useSearchAnnouncement'

/** Filters and ranks available extensions while retaining mandatory selections. */
export function useExtensionsSection() {
  const context = useProjectSetupDialogContext()
  const [searchTerm, setSearchTerm] = useState('')

  const template = context.state.selectedTemplate
  // A cloud template brings its own extensions, known once its package has been read.
  const available = !template
    ? []
    : template.isCloudTemplate
      ? (context.state.resolvedCloudTemplate?.extensions ?? [])
      : (context.props.data.extensions ?? [])
  const allItems = available.filter((ext) => !ext.hidden)

  const mandatoryKeys = new Set(
    allItems.filter((item) => item.isMandatoryForTemplate(template)).map((item) => String(item.key))
  )

  const selectedKeys = new Set(context.state.selectedExtensions.map((e) => String(e.key)))

  const sortedItems = useItemOrder(
    allItems,
    (item) =>
      mandatoryKeys.has(String(item.key)) ? 0 : selectedKeys.has(String(item.key)) ? 1 : 2,
    `${template?.id}|${context.state.resolvedCloudTemplate?.templateId}`
  )

  const items = searchTerm
    ? sortedItems.filter(
        (item) =>
          item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selectedKeys.has(String(item.key))
      )
    : sortedItems

  const onSelectionChange = (selectedIds: (string | number)[]) => {
    const newSelection = new Set(selectedIds.map(String))
    mandatoryKeys.forEach((key) => newSelection.add(key))
    const selectedItems = allItems.filter((item) => newSelection.has(String(item.key)))
    context.dispatch(ON_EXTENSIONS_CHANGED(selectedItems))
  }

  const onToggle = (key: string, checked: boolean) =>
    onSelectionChange(
      checked ? [...selectedKeys, key] : [...selectedKeys].filter((selected) => selected !== key)
    )

  // Hidden selections are applied but never listed, so they are not counted.
  const visibleSelectedCount = allItems.filter((item) => selectedKeys.has(String(item.key))).length

  const countText = format(strings.SelectedOfTotalLabel, visibleSelectedCount, allItems.length)
  useSearchAnnouncement(searchTerm, items.length, allItems.length)

  return {
    items,
    selectedKeys,
    onSelectionChange,
    onToggle,
    searchTerm,
    onSearch: setSearchTerm,
    showSearch: allItems.length > SEARCH_MIN_ITEMS,
    countText,
    // What the template requires stays selected.
    lockedKeys: mandatoryKeys
  }
}
