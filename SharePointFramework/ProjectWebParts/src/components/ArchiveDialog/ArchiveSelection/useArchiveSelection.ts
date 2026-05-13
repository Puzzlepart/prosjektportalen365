import { useEffect, useMemo, useState } from 'react'
import * as strings from 'ProjectWebPartsStrings'
import type { IArchiveItemHistory } from '../../../data/SPDataAdapter/types'
import { IArchiveItem, IArchiveSection, IArchiveSelectionProps } from './types'

type ItemId = string | number

const enrichWithHistory = (
  items: IArchiveItem[],
  history?: Map<string, IArchiveItemHistory>
): IArchiveItem[] => {
  if (!history || history.size === 0) return items
  return items.map((item) => {
    const previous =
      (item.itemId && history.get(item.itemId)) ||
      (item.url && history.get(item.url)) ||
      history.get(item.title)
    return previous ? { ...item, previousArchive: previous } : item
  })
}

const filterByPhase = (
  documents: IArchiveItem[],
  currentPhaseId: string | undefined
): IArchiveItem[] => {
  if (!currentPhaseId) return documents
  const matchingPhase = documents.filter((doc) => doc.projectPhaseId === currentPhaseId)
  const withoutPhase = documents.filter(
    (doc) => !doc.projectPhaseId || doc.projectPhaseId.trim() === ''
  )
  return [...withoutPhase, ...matchingPhase]
}

const applySelection = (items: IArchiveItem[], selectedIds: Set<ItemId>): IArchiveItem[] =>
  items.map((item) => ({ ...item, selected: selectedIds.has(item.id) }))

export function useArchiveSelection(props: IArchiveSelectionProps) {
  const { documents, lists, history, currentPhaseId, onConfigurationChange } = props
  const [selectedIds, setSelectedIds] = useState<Set<ItemId>>(new Set())

  const documentsSectionItems = useMemo(
    () =>
      applySelection(
        enrichWithHistory(filterByPhase(documents, currentPhaseId), history),
        selectedIds
      ),
    [documents, currentPhaseId, history, selectedIds]
  )
  const listsSectionItems = useMemo(
    () => applySelection(enrichWithHistory(lists, history), selectedIds),
    [lists, history, selectedIds]
  )

  const sections: IArchiveSection[] = useMemo(
    () => [
      {
        key: 'documents',
        title: strings.ArchiveDocumentsSection,
        items: documentsSectionItems
      },
      {
        key: 'lists',
        title: strings.ArchiveListsSection,
        items: listsSectionItems
      }
    ],
    [documentsSectionItems, listsSectionItems]
  )

  useEffect(() => {
    onConfigurationChange({
      documents: documentsSectionItems.filter((item) => item.selected),
      lists: listsSectionItems.filter((item) => item.selected)
    })
  }, [documentsSectionItems, listsSectionItems])

  const toggleItemSelection = (sectionKey: string, itemId: ItemId) => {
    const items = sectionKey === 'documents' ? documentsSectionItems : listsSectionItems
    const item = items.find((i) => i.id === itemId)
    if (item?.disabled) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const toggleSectionSelectAll = (sectionKey: string) => {
    const items = sectionKey === 'documents' ? documentsSectionItems : listsSectionItems
    const enabled = items.filter((i) => !i.disabled)
    if (enabled.length === 0) return
    const allSelected = enabled.every((i) => i.selected)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      enabled.forEach((item) => {
        if (allSelected) next.delete(item.id)
        else next.add(item.id)
      })
      return next
    })
  }

  return { sections, toggleItemSelection, toggleSectionSelectAll }
}
